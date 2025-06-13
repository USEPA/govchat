import {
  IconArrowDown,
  IconBolt,
  IconBrandGoogle,
  IconPlayerStop,
  IconRepeat,
  IconSend,
  IconHelpCircleFilled
} from '@tabler/icons-react';
import {
  KeyboardEvent,
  MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useTranslation } from 'next-i18next';

import { Message, Conversation, makeTimestamp } from '@/types/chat';
import { Plugin } from '@/types/plugin';
import { Prompt } from '@/types/prompt';

import HomeContext from '@/utils/home/home.context';

import { PluginSelect } from './PluginSelect';
import { PromptList } from './PromptList';
import { VariableModal } from './VariableModal';

import { FileUpload } from './FileUpload';


interface Props {
  onSend: (message: Message, plugin: Plugin | null) => void;
  onRegenerate: () => void;
  onScrollDownClick: () => void;
  stopConversationRef: MutableRefObject<boolean>;
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>;
  showScrollDownButton: boolean;
}

export const ChatInput = ({
  onSend,
  onRegenerate,
  onScrollDownClick,
  stopConversationRef,
  textareaRef,
  showScrollDownButton,
}: Props) => {
  const { t } = useTranslation('chat');

  const {
    state: { selectedConversation, messageIsStreaming, prompts },

    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [content, setContent] = useState<string>();
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showPromptList, setShowPromptList] = useState(false);
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showPluginSelect, setShowPluginSelect] = useState(false);
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [promptCharacterLength, setPromptCharacterLength] = useState(0);
  const [characterLength, setCharacterLength] = useState(0);

  const promptListRef = useRef<HTMLUListElement | null>(null);

  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  const filteredPrompts = prompts.filter((prompt) =>
    prompt.name.toLowerCase().includes(promptInputValue.toLowerCase()),
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPromptCharacterLength((selectedConversation?.characterLength ?? 0) + value.length);
    setContent(value);
    updatePromptListVisibility(value);
  };


  const handleSend = () => {

    console.log('handleSend triggered ');

    if (messageIsStreaming) {
      console.log('handleSend messageIsStreaming');
      return;
    }

    if (!content) {
      alert(t('Please enter a message'));
      return;
    }


    if (uploadFiles && uploadFiles.length > 0) {
      console.log('files attached: ' + uploadFiles.length);

      //var fileContent = getContentForFiles(content, uploadFiles);

      getContentForFiles(content, uploadFiles).then(fileContent => {

        console.log('new content from async func, length: ' + fileContent.length);
        console.log(fileContent);

        var newContent = `[{"type": "text","text": "${content}"},${fileContent}]`; 

        onSend({ role: 'user', content: newContent, timestamp: makeTimestamp() }, plugin);

        setContent('');
        setPlugin(null);
        setUploadFiles([]);
      })
      .catch(error => {
        //do nothing
      })

    }
    else {
      console.log('no files attached');

      onSend({ role: 'user', content, timestamp: makeTimestamp() }, plugin);
      setContent('');
      setPlugin(null);
      setUploadFiles([]);
    }

    if (window.innerWidth < 640 && textareaRef && textareaRef.current) {
      textareaRef.current.blur();
    }

  };


  const getContentForFiles2 = async (content: string, files: File[]) => {

    let tmpContent = "";

    const filePromises = files.map((file) => {
      // Return a promise per file

      console.log('--file: ' + file.name);
      tmpContent += '{"type": "file","file":{"filename": "' + file.name + '"}}';
    });

    return tmpContent.substring(0, tmpContent.length - 1);  
  };


  const getContentForFiles = async (content: string, files: File[]) => {

    let tmpContent = "";

    const filePromises = files.map((file) => {
      // Return a promise per file
      return new Promise((resolve, reject) => {
        console.log('--file: ' + file.name);
        const reader = new FileReader();

        reader.onload = async () => {
          try {
            const base64String = reader.result;

            tmpContent += '{"type": "file","file":{"filename": "' + file.name + '","file_data": "`' + base64String + '`"}},';

            // Resolve the promise with the response value
            resolve(tmpContent);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = (error) => {
          console.error("Error reading file:", file.name);
          reject(error);
        };
        reader.readAsDataURL(file);
      });
    });

    // Wait for all promises to be resolved
    const resultStr = await Promise.all(filePromises);

    console.log('COMPLETED');

    return tmpContent.substring(0, tmpContent.length - 1);  
  };

  const handleStopConversation = () => {
    stopConversationRef.current = true;
    setTimeout(() => {
      stopConversationRef.current = false;
    }, 1000);
  };

  const isMobile = () => {
    const userAgent =
      typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
    return mobileRegex.test(userAgent);
  };

  const handleInitModal = () => {
    const selectedPrompt = filteredPrompts[activePromptIndex];
    if (selectedPrompt) {
      setContent((prevContent) => {
        const newContent = prevContent?.replace(
          /\/\w*$/,
          selectedPrompt.content,
        );
        return newContent;
      });
      handlePromptSelect(selectedPrompt);
    }
    setShowPromptList(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPromptList) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : prevIndex,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : prevIndex,
        );
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : 0,
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleInitModal();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowPromptList(false);
      } else {
        setActivePromptIndex(0);
      }
    } else if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === '/' && e.metaKey) {
      e.preventDefault();
      setShowPluginSelect(!showPluginSelect);
    }
  };

  const handleFileSelect = (uploadFiles: File[]) => {
    setUploadFiles(uploadFiles);
  }

  const parseVariables = (content: string) => {
    const regex = /{{(.*?)}}/g;
    const foundVariables = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      foundVariables.push(match[1]);
    }

    return foundVariables;
  };

  const updatePromptListVisibility = useCallback((text: string) => {
    const match = text.match(/\/\w*$/);

    if (match) {
      setShowPromptList(true);
      setPromptInputValue(match[0].slice(1));
    } else {
      setShowPromptList(false);
      setPromptInputValue('');
    }
  }, []);

  const handlePromptSelect = (prompt: Prompt) => {
    const parsedVariables = parseVariables(prompt.content);
    setVariables(parsedVariables);

    if (parsedVariables.length > 0) {
      setIsModalVisible(true);
    } else {
      setContent((prevContent) => {
        const updatedContent = prevContent?.replace(/\/\w*$/, prompt.content);
        return updatedContent;
      });
      updatePromptListVisibility(prompt.content);
    }
  };

  const handleSubmit = (updatedVariables: string[]) => {
    const newContent = content?.replace(/{{(.*?)}}/g, (match, variable) => {
      const index = variables.indexOf(variable);
      return updatedVariables[index];
    });

    setContent(newContent);

    if (textareaRef && textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  useEffect(() => {
    if (promptListRef.current) {
      promptListRef.current.scrollTop = activePromptIndex * 30;
    }
  }, [activePromptIndex]);

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`;
      textareaRef.current.style.overflow = `${
          textareaRef?.current?.scrollHeight > 400 ? 'auto' : 'hidden'
        }`;
    }
  }, [content]);


  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        promptListRef.current &&
        !promptListRef.current.contains(e.target as Node)
      ) {
        setShowPromptList(false);
      }
    };

    window.addEventListener('click', handleOutsideClick);

    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const maxLength = selectedConversation?.model.maxLength ?? 0;

  return (
    <div className="absolute bottom-0 left-0 w-full border-transparent bg-gradient-to-b from-transparent via-white to-white pt-6 dark:border-white/20 dark:via-[#343541] dark:to-[#343541] md:pt-2">
      <div className="stretch mx-2 mt-4 flex flex-row gap-3 last:mb-2 md:mx-4 md:mt-[52px] md:last:mb-12 lg:mx-auto lg:max-w-3xl">
        {messageIsStreaming && (
          <button
            className="absolute top-0 left-0 right-0 mx-auto mb-3 flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white py-2 px-4 text-black hover:opacity-50 dark:border-neutral-600 dark:bg-[#343541] dark:text-white md:mb-0 md:mt-2"
            onClick={handleStopConversation}
            title="Stop Conversation"
            aria-label='Stop Conversation'
          >
            <IconPlayerStop size={16} /> {t('Stop Generating')}
          </button>
        )}

        {!messageIsStreaming &&
          selectedConversation &&
          selectedConversation.messages.length > 0 && (
            <button
              className="absolute top-0 left-0 right-0 mx-auto mb-3 flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white py-2 px-4 text-black hover:opacity-50 dark:border-neutral-600 dark:bg-[#343541] dark:text-white md:mb-0 md:mt-2"
              onClick={onRegenerate}
              title="Regenerate response"
              aria-label='Regenerate response'
            >
              <IconRepeat size={16} /> {t('Regenerate response')}
            </button>
          )}

        <div className="relative mx-2 flex w-full flex-grow flex-col rounded-md border border-black/10 bg-white shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:border-gray-900/50 dark:bg-[#40414F] dark:text-white dark:shadow-[0_0_15px_rgba(0,0,0,0.10)] sm:mx-4">

          <textarea
            ref={textareaRef}
            className="placeholder-neutral-700 m-0 w-full resize-none border-0 bg-transparent p-0 py-2 pr-4 pl-4 text-black dark:bg-transparent dark:text-white md:py-3 md:pl-4"
            style={{
              resize: 'none',
              bottom: `${textareaRef?.current?.scrollHeight}px`,
              maxHeight: '400px',
              overflow: `${
              textareaRef.current && textareaRef.current.scrollHeight > 400
                ? 'auto'
                : 'hidden'
                }`,
            }}
            placeholder={
              t('Type a message ') || ''
            }
            value={content}
            rows={1}
            onCompositionStart={() => setIsTyping(true)}
            onCompositionEnd={() => setIsTyping(false)}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            id="ChatInput"
            aria-label="Chat input field"
            autoFocus
          />

          <FileUpload onFileSelect={handleFileSelect} />

          <button
            className="absolute right-2 top-2 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
            onClick={handleSend}
            title="Send"
            aria-label='Send'
          >
            {messageIsStreaming ? (
              <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-neutral-800 opacity-60 dark:border-neutral-100"></div>
            ) : (
              <IconSend size={18} />
            )}
          </button>

          {showScrollDownButton && (
            <div className="absolute bottom-12 right-0 lg:bottom-0 lg:-right-10">
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-300 text-gray-800 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-neutral-200"
                onClick={onScrollDownClick}
                title="Scroll to bottom"
                aria-label="Scroll to bottom"
              >
                <IconArrowDown size={18} />
              </button>
            </div>
          )}

          {showPromptList && filteredPrompts.length > 0 && (
            <div className="absolute bottom-12 w-full">
              <PromptList
                activePromptIndex={activePromptIndex}
                prompts={filteredPrompts}
                onSelect={handleInitModal}
                onMouseOver={setActivePromptIndex}
                promptListRef={promptListRef}
              />
            </div>
          )}

          {isModalVisible && (
            <VariableModal
              prompt={filteredPrompts[activePromptIndex]}
              variables={variables}
              onSubmit={handleSubmit}
              onClose={() => setIsModalVisible(false)}
            />
          )}



          {(promptCharacterLength <= maxLength && promptCharacterLength > maxLength * .75) && (
            <div className="text-orange-500 m-4">
              Warning: you are approaching the number of words this model is able to handle. Consider starting a new conversation. Characters left: {maxLength - promptCharacterLength}
              
              <span className="inline-block relative top-[2px] pl-1"
                title="Once past the context limit, the conversation will no longer produce responses relevant to content before the limit">
                <IconHelpCircleFilled stroke={2} size={16} />
              </span>
            </div>
          )}

          {promptCharacterLength > maxLength && (
            <div className="text-red-500 m-4">
              This prompt or conversation is too large for this model. Approximate number of characters over: {promptCharacterLength - maxLength}
              <span className="inline-block relative top-[2px] pl-1"
                title="Once past the context limit, the conversation will no longer produce responses relevant to content before the limit">
                <IconHelpCircleFilled stroke={2} size={16} />
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
