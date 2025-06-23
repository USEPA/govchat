import { IconClearAll, IconSettings, IconDownload, IconFolderDown } from '@tabler/icons-react';
import {
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

import { getEndpoint } from '@/utils/app/api';
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation';
import { throttle } from '@/utils/data/throttle';

import { ChatBody, Conversation, Message, makeTimestamp } from '@/types/chat';
import { Plugin } from '@/types/plugin';

import HomeContext from '@/utils/home/home.context';

import Spinner from '../Spinner';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { ErrorMessageDiv } from './ErrorMessageDiv';
import { Rules } from './Rules';
import { Notice } from './Notice';
import { MemoizedChatMessage } from './MemoizedChatMessage';
import { AdvancedSettings } from './AdvancedSettings';

interface Props {
  stopConversationRef: MutableRefObject<boolean>;
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(
    async (message: Message, deleteCount = 0, plugin: Plugin | null = null) => {
      if (selectedConversation) {
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
        const chatBody: ChatBody = {
          conversationId: updatedConversation.id,
          model: updatedConversation.model,
          messages: updatedConversation.messages.map(({ role, content }) => ({role, content })),
          key: apiKey,
          prompt: updatedConversation.prompt,
          temperature: updatedConversation.temperature,
          assistantId: updatedConversation.assistantId || null,
        };
        const endpoint = getEndpoint(plugin);
        let body;
        if (!plugin) {
          body = JSON.stringify(chatBody);
        } else {
          body = JSON.stringify({
            ...chatBody,
            googleAPIKey: pluginKeys
              .find((key) => key.pluginId === 'google-search')
              ?.requiredKeys.find((key) => key.key === 'GOOGLE_API_KEY')?.value,
            googleCSEId: pluginKeys
              .find((key) => key.pluginId === 'google-search')
              ?.requiredKeys.find((key) => key.key === 'GOOGLE_CSE_ID')?.value,
          });
        }
        const controller = new AbortController();

        console.log('chat.tsx - handleSend - endpoint:' + endpoint);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body,
        });
        if (!response.ok) {
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          const errorMsg = await response.text();
          if (errorMsg.includes('have exceeded call rate limit')) {
            toast.error("This model is currently overloaded. Please try again in a few minutes.");
          } else {
             toast.error(response.statusText);
          }
          
          return;
        }
        const data = response.body;
        if (!data) {
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          return;
        }
  
        if (!plugin) {
          console.log('chat.tsx - handleSend - !plugin');
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
                { role: 'assistant', content: chunkValue, timestamp: makeTimestamp() },
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
          // updatedConversation.assistantId = response.headers.get('assistantId') || null;
          // updatedConversation.threadId = response.headers.get('threadId') || null;
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
        } else {
          console.log('chat.tsx - handleSend - plugin');
          const { answer } = await response.json();

          // res.body.content.threadId   // OpenAIConversation threadId, assistantId
          // res.setHeader('assistantId', assistantId || '');
          // res.setHeader('threadId', threadId || '');
    
          try{
            updatedConversation.assistantId = answer.assistantId;
            updatedConversation.threadId = answer.threadId;
          }
          catch{}

          const updatedMessages: Message[] = [
            ...updatedConversation.messages,
            { role: 'assistant', content: answer, timestamp: makeTimestamp() },
          ];
          updatedConversation = {
            ...updatedConversation,
            messages: updatedMessages,
          };
          homeDispatch({
            field: 'selectedConversation',
            value: updateConversation,
          });

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
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
        }
      }
    },
    [
      apiKey,
      conversations,
      pluginKeys,
      selectedConversation,
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
        if(loading) {
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

  // useEffect(() => {
  //   console.log('currentMessage', currentMessage);
  //   if (currentMessage) {
  //     handleSend(currentMessage);
  //     homeDispatch({ field: 'currentMessage', value: undefined });
  //   }
  // }, [currentMessage]);

  useEffect(() => {
    throttledScrollDown();
    selectedConversation &&
      setCurrentMessage(
        selectedConversation.messages[selectedConversation.messages.length - 2],
      );
  }, [selectedConversation, throttledScrollDown]);

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
                  {(selectedConversation?.model.name != "GPT-4") ? "Model: " + (selectedConversation?.model.name) + " | " : ""}
                  {t('Temp')} : {selectedConversation?.temperature}

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
            onSend={(message, plugin) => {
              setCurrentMessage(message);
              handleSend(message, 0, plugin);
              sendGTMEvent({ event: 'messageSent', messageLength: message.content.length });
            }}
            onScrollDownClick={handleScrollDown}
            onRegenerate={() => {
              if (currentMessage) {
                handleSend(currentMessage, 2, null);
              }
            }}
            showScrollDownButton={showScrollDownButton}
          />
        </>
      )}
    </div>
  );
});
Chat.displayName = 'Chat';
