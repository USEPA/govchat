import { IconClearAll, IconSettings, IconDownload, IconFolderDown } from '@tabler/icons-react';
import {
  Dispatch,
  MutableRefObject,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import { sendGTMEvent } from '@next/third-parties/google'

import { useTranslation } from 'next-i18next';

import {
  filterMessageText,
  setFileUploadText,
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation';
import { throttle } from '@/utils/data/throttle';

import { ChatBody, Conversation, Message, makeTimestamp } from '@/types/chat';
import { OpenAIModels } from '@/types/openai';

import HomeContext from '@/utils/home/home.context';

import Spinner from '../Spinner';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { ErrorMessageDiv } from './ErrorMessageDiv';
import { Rules } from './Rules';
import { Notice } from './Notice';
import { MemoizedChatMessage } from './MemoizedChatMessage';
import { AdvancedSettings } from './AdvancedSettings';
import { timeStamp } from 'console';
import { ActionType } from '@/hooks/useCreateReducer';
import { HomeInitialState } from '@/utils/home/home.state';

interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}

const showError = (errorMessage: string, dispatch: Dispatch<ActionType<HomeInitialState>>) => {
  dispatch({ field: 'loading', value: false });
  dispatch({ field: 'messageIsStreaming', value: false });
  toast.error(errorMessage, {duration: 10000});
}

function insertMessageBeforeLast(
  conversation: Conversation,
  content: string
): Conversation {
  const { messages } = conversation;
  if (messages.length === 0) return conversation;
  const last = messages[messages.length - 1];
  return {
    ...conversation,
    messages: [
      ...messages.slice(0, -1),
      { role: 'fileUpload', content, timestamp: last.timestamp },
      last,
    ],
  };
}

export const Chat = memo(({ stopConversationRef }: Props) => {
  const { t } = useTranslation('chat');

  const {
    state: {
      selectedConversation,
      conversations,
      models,
      apiKey,
      pluginKeys,
      serverSideApiKeyIsSet,
      messageIsStreaming,
      modelError,
      loading,
      prompts,
    },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [currentMessage, setCurrentMessage] = useState<Message>();
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showScrollDownButton, setShowScrollDownButton] =
    useState<boolean>(false);
  const [filesLeftToUpload, setFilesLeftToUpload] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(
    async (message: Message, deleteCount = 0, uploadFiles: File[] | null = null, useGrounding: boolean = false) => {
      if (!selectedConversation) {
        return;
      }
      const isNewUploadFiles = uploadFiles && uploadFiles.length > 0;
      const useAssistant = selectedConversation.assistantId || isNewUploadFiles || null;
      let updatedConversation: Conversation;
      if (deleteCount) {
        const updatedMessages = [...selectedConversation.messages];
        for (let i = 0; i < deleteCount; i++) {
          updatedMessages.pop();
        }
        updatedConversation = {
          ...selectedConversation,
          messages: [...updatedMessages, message],
        };
      } else {
        updatedConversation = {
          ...selectedConversation,
          messages: [...selectedConversation.messages, message],
        };
      }
      homeDispatch({
        field: 'selectedConversation',
        value: updatedConversation,
      });
      homeDispatch({ field: 'loading', value: true });
      homeDispatch({ field: 'messageIsStreaming', value: true });

      // If there's a file upload first we need to run a call to get the assistant id and vector store id using /api/getids
      if (useAssistant && !selectedConversation.vectorStoreJWE) {
        const response = await fetch('api/getids', {
          method: 'POST',
          body: ""
        });
        await response.json().then((data) => {
          if (data.vectorStoreJWE) {
            updatedConversation = {
              ...updatedConversation,
              vectorStoreJWE: data.vectorStoreJWE
            };
            homeDispatch({ field: 'selectedConversation', value: updatedConversation });
          } else {
            return showError('Failed to get assistant and thread IDs', homeDispatch);
          }
        })
      }
      // then we need to upload all the files to /api/upload
      if(isNewUploadFiles) {
          setFilesLeftToUpload(1);
          // Use multipart/form-data to upload files
          const formData = new FormData();
          uploadFiles.forEach((file) => {
            formData.append('files', file);
          });
          const uploadResponse =  await fetch(`api/upload?vectorStoreJWE=${updatedConversation.vectorStoreJWE || ''}`, {
            method: 'POST',
            body: formData,
          });
          setFilesLeftToUpload(0);
          if (!uploadResponse.ok) {
            try {
              const errorMessage = (await uploadResponse.json()).error;
              return showError(`Failed to upload files: ${errorMessage}`, homeDispatch);
            } catch (e) {
              return showError("Failed to upload files", homeDispatch);
            }
          } else {
            const newFileIds = await uploadResponse.json();
            updatedConversation.fileIds = [
              ...(updatedConversation.fileIds ?? []),
              ...newFileIds,
            ];
            const fileNames = uploadFiles.map(file => file.name);
            updatedConversation = insertMessageBeforeLast(updatedConversation,
              `New files attached: ${fileNames.join(', ')}\n\n` +
              "*You can refer to these messages at any time in your conversation*."
            )
            homeDispatch({ field: 'selectedConversation', value: updatedConversation });
          }
      }

      const chatBody: ChatBody = {
        key: apiKey,
        prompt: updatedConversation.prompt,
        conversation: updatedConversation,
        useGrounding
      };

      const controller = new AbortController();
      const response = await fetch('api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify(chatBody),
      });
      if (!response.ok) {
        return showError(response.statusText, homeDispatch);
      }
      const data = response.body;
      if (!data) {
        return showError('No response data received', homeDispatch);
      }

      if (updatedConversation.messages.length === 1) {
        const { content } = message;
        const customName =
          content.length > 30 ? content.substring(0, 30) + '...' : content;
        updatedConversation = {
          ...updatedConversation,
          name: customName,
        };
      }
      homeDispatch({ field: 'loading', value: false });
      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let isFirst = true;
      let text = '';
      while (!done) {
        if (stopConversationRef.current === true) {
          controller.abort();
          done = true;
          break;
        }
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        text += chunkValue;
        if (isFirst) {
          isFirst = false;
          const updatedMessages: Message[] = [
            ...updatedConversation.messages,
            { role: 'assistant', content: chunkValue, timestamp: makeTimestamp(), useGrounding },
          ];
          updatedConversation = {
            ...updatedConversation,
            messages: updatedMessages,
          };
          homeDispatch({
            field: 'selectedConversation',
            value: updatedConversation,
          });
        } else {
          const updatedMessages: Message[] =
            updatedConversation.messages.map((message, index) => {
              if (index === updatedConversation.messages.length - 1) {
                return {
                  ...message,
                  content: text,
                  useGrounding,
                };
              }
              return message;
            });
          updatedConversation = {
            ...updatedConversation,
            messages: updatedMessages,
          };
          homeDispatch({
            field: 'selectedConversation',
            value: updatedConversation,
          });
        }
      }

      if (useGrounding) {
        const updatedMessages: Message[] =
          updatedConversation.messages.map((message, index) => {
            if (index === updatedConversation.messages.length - 1) {
              return {
                ...message,
                content: `${message.content}\n\n_This response was generated using web grounding_.`,
              };
            }
            return message;
          });
        updatedConversation = {
          ...updatedConversation,
          messages: updatedMessages,
        };
        homeDispatch({
          field: 'selectedConversation',
          value: updatedConversation,
        });
      }

      saveConversation(updatedConversation);
      const updatedConversations: Conversation[] = conversations.map(
        (conversation) => {
          if (conversation.id === selectedConversation.id) {
            return updatedConversation;
          }
          return conversation;
        },
      );
      if (updatedConversations.length === 0) {
        updatedConversations.push(updatedConversation);
      }
      homeDispatch({ field: 'conversations', value: updatedConversations });
      saveConversations(updatedConversations);
      homeDispatch({ field: 'messageIsStreaming', value: false });
    },
    [
      apiKey,
      conversations,
      selectedConversation,
      homeDispatch,
      stopConversationRef,
    ],
  );

  const scrollToBottom = useCallback(() => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      textareaRef.current?.focus();
    }
  }, [autoScrollEnabled]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const bottomTolerance = 230;

      if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
        setAutoScrollEnabled(false);
        setShowScrollDownButton(true);
      } else {
        if (loading) {
          setAutoScrollEnabled(true);
        }
        setShowScrollDownButton(false);
      }
    }
  };

  const handleScrollDown = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleSettings = () => {
    setShowSettings(!showSettings);
  };

  const onClearAll = () => {
    if (
      confirm(t<string>('Are you sure you want to clear all messages?')) &&
      selectedConversation
    ) {
      handleUpdateConversation(selectedConversation, {
        key: 'messages',
        value: [],
      });
    }
  };

  const downloadTextFile = (filename: string, text: string) => {
    const link = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([text], { type: 'text/plain' })),
      download: filename,
    });

    document.body.append(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const onDownload = () => {
    const messages = selectedConversation?.messages;
    if (!messages?.length) return;
    const text = messages
      .map(({ role, content, timestamp }) => {
        const time = timestamp ? `(${timestamp})` : '';
        return `[${role}] ${time}\n${content}\n`;
      })
      .join('\n');

    downloadTextFile(`conversation_${selectedConversation?.id}.txt`, text);
  };

  const onDownloadFolder = () => {
    const sameFolderConversations = conversations.filter(
      (conv) => conv.folderId === selectedConversation?.folderId
    );
    const text = sameFolderConversations
      .map((conv, index) => {
        const messagesText = conv.messages
          ?.map(({ role, content, timestamp }) => {
            const time = timestamp ? `(${timestamp})` : '';
            return `[${role}] ${time}\n${content}\n`;
          })
          .join('\n') || '';
        return `=== ${conv.name} ===\n${messagesText}`;
      })
      .join('\n\n');

    downloadTextFile('folder_conversations.txt', text);
  };


  const scrollDown = () => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView(true);
    }
  };
  const throttledScrollDown = throttle(scrollDown, 250);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    throttledScrollDown();
    selectedConversation &&
      setCurrentMessage(
        selectedConversation.messages[selectedConversation.messages.length - 2],
      );
  }, [selectedConversation, throttledScrollDown]);

  useEffect(() => {
    if (!selectedConversation?.model) return;
    const firstModel = Object.values(OpenAIModels)[0];
    if (selectedConversation.model.id !== firstModel.id) {
      handleUpdateConversation(selectedConversation, {
        key: 'model',
        value: firstModel,
      });
    }
  }, [handleUpdateConversation, selectedConversation]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoScrollEnabled(entry.isIntersecting);
        if (entry.isIntersecting) {
          textareaRef.current?.focus();
        }
      },
      {
        root: null,
        threshold: 0.5,
      },
    );
    const messagesEndElement = messagesEndRef.current;
    if (messagesEndElement) {
      observer.observe(messagesEndElement);
    }
    return () => {
      if (messagesEndElement) {
        observer.unobserve(messagesEndElement);
      }
    };
  }, [messagesEndRef]);

  return (
    <div className="relative flex-1 overflow-hidden bg-white dark:bg-[#343541]">
      {!(apiKey || serverSideApiKeyIsSet) ? (
        <div className="mx-auto flex h-full w-[300px] flex-col justify-center space-y-6 sm:w-[600px]">
          <div className="text-center text-4xl font-bold text-black dark:text-white">
            Welcome
          </div>
          <div className="text-center text-lg text-black dark:text-white">
            <div className="mb-8">{`Open source clone of OpenAI's ChatGPT UI.`}</div>
          </div>
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="mb-2">
              You can to plug in your API key to use this UI with
              Azure OpenAI. No warranty is provided.
            </div>
            <div className="mb-2">
              It is <span className="italic">only</span> used to communicate
              with their Azure OpenAI.
            </div>
            <div className="mb-2">
              {t(
                'Please set your OpenAI API key in the bottom left of the sidebar.',
              )}
            </div>
            <div>
              {t("If you don't have an OpenAI API key, you can get one here: ")}
              <a
                href="https://platform.openai.com/account/api-keys"
                target="_blank"
                rel="noreferrer noopener"
                className="text-blue-500 hover:underline"
              >
                openai.com
              </a>
            </div>
          </div>
        </div>
      ) : modelError ? (
        <ErrorMessageDiv error={modelError} />
      ) : (
        <>
          <div
            className="max-h-full overflow-x-hidden"
            ref={chatContainerRef}
            onScroll={handleScroll}
            aria-live="polite"
          >
            {selectedConversation?.messages.length === 0 ? (
              <>
                <div className="mx-auto flex flex-col space-y-5 md:space-y-0 mb-40 px-3 pt-5 md:pt-6 sm:max-w-[600px]">
                  <div className="text-center text-3xl font-semibold text-gray-800 dark:text-gray-100">
                    {models.length === 0 ? (
                      <div>
                        <Spinner size="16px" className="mx-auto" />
                      </div>
                    ) : (
                      ''
                    )}
                  </div>


                  <div className="flex h-full flex-col space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-600">
                    <img
                      src="images/cover.jpg"
                      alt="Decorative image of a robot hand holding a transparent globe."
                      className="w-full h-[200px] object-cover rounded-lg object-bottom"
                    />
                    <Notice />
                    <Rules isAdvancedOpen={showAdvanced} />
                    <AdvancedSettings
                      selectedConversation={selectedConversation}
                      prompts={prompts}
                      handleUpdateConversation={handleUpdateConversation}
                      t={t}
                      onToggle={setShowAdvanced}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="sticky top-0 z-10 flex justify-center border border-b-neutral-300 bg-neutral-100 py-2 text-sm text-neutral-700 dark:border-none dark:bg-[#444654] dark:text-neutral-200">
                  <button
                    className="mr-2 cursor-pointer hover:opacity-50"
                    onClick={onClearAll}
                    title="Clear all messages"
                    aria-label='Clear all messages'
                  >
                    <IconClearAll size={18} />
                  </button>
                  Model: {selectedConversation?.model.name}

                  <button
                    className="ml-2 cursor-pointer hover:opacity-50"
                    onClick={onDownload}
                    title="Download conversation"
                    aria-label="Download conversation"
                  >
                    <IconDownload size={18} />
                  </button>

                  {selectedConversation?.folderId !== "0" && selectedConversation?.folderId && (
                    <button
                      className="ml-2 cursor-pointer hover:opacity-50"
                      onClick={onDownloadFolder}
                      title="Download all conversations in this folder"
                      aria-label="Download all conversations in this folder"
                    >
                      <IconFolderDown size={18} />
                    </button>
                  )}
                </div>

                {selectedConversation?.messages.map((message, index) => (
                  <MemoizedChatMessage
                    key={index}
                    message={message}
                    messageIndex={index}
                    onEdit={(editedMessage) => {
                      setCurrentMessage(editedMessage);
                      // discard edited message and the ones that come after then resend
                      handleSend(
                        editedMessage,
                        selectedConversation?.messages.length - index,
                        [],
                        editedMessage.useGrounding
                      );
                    }}
                  />
                ))}

                {loading && <ChatLoader />}

                <div
                  className="h-[230px] bg-white dark:bg-[#343541]"
                  ref={messagesEndRef}
                />
              </>
            )}
          </div>

          <ChatInput
            stopConversationRef={stopConversationRef}
            textareaRef={textareaRef}
            onSend={(message, uploadFiles, useGrounding) => {
              setCurrentMessage(message);
              handleSend(message, 0, uploadFiles, useGrounding);
              sendGTMEvent({ event: 'messageSent', messageLength: message.content.length });
            }}
            onScrollDownClick={handleScrollDown}
            onRegenerate={(useGrounding) => {
              if (currentMessage) {
                const lastMessage = selectedConversation?.messages[selectedConversation?.messages.length - 1];
                handleSend(currentMessage, 2, [], lastMessage?.useGrounding ?? false);
              }
            }}
            showScrollDownButton={showScrollDownButton}
            filesLeftToUpload={filesLeftToUpload}
          />
        </>
      )}
    </div>
  );
});
Chat.displayName = 'Chat';
