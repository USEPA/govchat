import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconExternalLink,
  IconFileStack,
  IconPaperclip,
  IconRobot,
  IconTrash,
  IconUser,
} from '@tabler/icons-react';
import { FC, memo, useContext, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { updateConversation } from '@/utils/app/conversation';

import { Message, makeTimestamp } from '@/types/chat';

import HomeContext from '@/utils/home/home.context';

import { CodeBlock } from '../Markdown/CodeBlock';
import { MemoizedReactMarkdown } from '../Markdown/MemoizedReactMarkdown';

import rehypeMathjax from 'rehype-mathjax';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { rehypeReference } from '../Markdown/ReHypeReference';
import { v4 as uuidv4 } from 'uuid';

export interface Props {
  message: Message;
  messageIndex: number;
  onEdit?: (editedMessage: Message) => void
}

export const ChatMessage: FC<Props> = memo(({ message, messageIndex, onEdit }) => {
  const { t } = useTranslation('chat');

  const {
    state: { selectedConversation, conversations, currentMessage, messageIsStreaming },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [messageContent, setMessageContent] = useState(message.content);
  const [messagedCopied, setMessageCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const newThreadWithFiles = () => {
    const fileNotice = '*You can refer to these messages at any time in your conversation*.'
    if (!selectedConversation) return;
    let fileMessageMessage: string = selectedConversation.messages.filter(
      (msg) => msg.role === 'fileUpload'
    ).reduce((acc, msg) => {return acc + msg.content + "\n\n";}, "");
    fileMessageMessage = fileMessageMessage.replaceAll(fileNotice, '') + fileNotice;
    fileMessageMessage = fileMessageMessage + 
    "\n\n*Note that this conversation shares its file storage with the original conversation, so uploading more files here may impact other conversations.*";

    const newConversation = {
      ...selectedConversation,
      id: uuidv4(),
      name: selectedConversation.name + ' (Files)',
      messages: [
        {
          role: 'fileUpload',
          content: fileMessageMessage,
          timestamp: makeTimestamp()
        },
      ],
    };
    const updatedConversations = [newConversation, ...conversations];
    homeDispatch({ field: 'selectedConversation', value: newConversation });
    homeDispatch({ field: 'conversations', value: updatedConversations });
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageContent(event.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleEditMessage = () => {
    if (message.content != messageContent) {
      if (selectedConversation && onEdit) {
        onEdit({ ...message, content: messageContent, timestamp: makeTimestamp()});
      }
    }
    setIsEditing(false);
  };

  const handleDeleteMessage = () => {
    if (!selectedConversation) return;

    const { messages } = selectedConversation;
    const findIndex = messages.findIndex((elm) => elm === message);

    if (findIndex < 0) return;

    if (
      findIndex < messages.length - 1 &&
      messages[findIndex + 1].role === 'assistant'
    ) {
      messages.splice(findIndex, 2);
    } else {
      messages.splice(findIndex, 1);
    }
    const updatedConversation = {
      ...selectedConversation,
      messages,
    };

    const { single, all } = updateConversation(
      updatedConversation,
      conversations,
    );
    homeDispatch({ field: 'selectedConversation', value: single });
    homeDispatch({ field: 'conversations', value: all });
  };

  const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !isTyping && !e.shiftKey) {
      e.preventDefault();
      handleEditMessage();
    }
  };

  const copyOnClick = () => {
    if (!navigator.clipboard) return;

    navigator.clipboard.writeText(message.content).then(() => {
      setMessageCopied(true);
      setTimeout(() => {
        setMessageCopied(false);
      }, 2000);
    });
  };

  useEffect(() => {
    setMessageContent(message.content);
  }, [message.content]);


  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  return (
    <div
      className={`group md:px-4 ${
        message.role === 'assistant'
          ? 'border-b border-black/10 bg-gray-50 text-gray-800 dark:border-gray-900/50 dark:bg-[#444654] dark:text-gray-100'
          : 'border-b border-black/10 bg-white text-gray-800 dark:border-gray-900/50 dark:bg-[#343541] dark:text-gray-100'
      }`}
      style={{ overflowWrap: 'anywhere' }}
    >
      <div className="relative m-auto flex p-4 text-base md:max-w-2xl md:gap-6 md:py-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
        <div className="min-w-[40px] text-right font-bold">
          { 
            message.role === 'assistant' ? (
              <IconRobot size={30} />
            ) : (
              message.role === 'fileUpload' ? (
                <IconPaperclip size={30} />
              ) : (
                <IconUser size={30} />
              )
            )
          }
        </div>

        <div className="prose mt-[-2px] w-full dark:prose-invert">
          {message.role === 'user' ? (
            <div className="flex w-full">
              {isEditing ? (
                <div className="flex w-full flex-col">
                  <textarea
                    ref={textareaRef}
                    className="w-full resize-none whitespace-pre-wrap border-none dark:bg-[#343541]"
                    value={messageContent}
                    onChange={handleInputChange}
                    onKeyDown={handlePressEnter}
                    onCompositionStart={() => setIsTyping(true)}
                    onCompositionEnd={() => setIsTyping(false)}
                    style={{
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      lineHeight: 'inherit',
                      padding: '0',
                      margin: '0',
                      overflow: 'hidden',
                    }}
                    aria-label="Edit chat message"
                  />

                  <div className="mt-10 flex justify-center space-x-4">
                    <button
                      className="h-[40px] rounded-md bg-blue-500 px-4 py-1 text-sm font-medium text-white enabled:hover:bg-blue-600 disabled:opacity-50"
                      onClick={handleEditMessage}
                      disabled={messageContent.trim().length <= 0}
                      title='Edit Message'
                      aria-label="Edit Message"
                    >
                      {t('Save & Submit')}
                    </button>
                    <button
                      className="h-[40px] rounded-md border border-neutral-300 px-4 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      onClick={() => {
                        setMessageContent(message.content);
                        setIsEditing(false);
                      }}
                      title="Cancel"
                      aria-label='Cancel'
                    >
                      {t('Cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="prose whitespace-pre-wrap dark:prose-invert flex-1">
                  {message.content}
                </div>
              )}

              {!isEditing && (
                <div className="md:-mr-8 ml-1 md:ml-0 flex flex-col md:flex-row gap-4 md:gap-1 items-center md:items-start justify-end md:justify-start">
                  <button
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    onClick={toggleEditing}
                    title="Edit Message"
                    aria-label='Edit Message'
                  >
                    <IconEdit size={20} />
                  </button>
                  <button
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    onClick={handleDeleteMessage}
                    title="Delete Message"
                    aria-label='Delete Message'
                  >
                    <IconTrash size={20} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-row">
              <MemoizedReactMarkdown
                className="prose dark:prose-invert flex-1"
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeMathjax, rehypeReference]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    if (children.length) {
                      if (children[0] == '▍') {
                        return <span className="animate-pulse cursor-default mt-1">▍</span>
                      }

                      children[0] = (children[0] as string).replace("`▍`", "▍")
                    }

                    const match = /language-(\w+)/.exec(className || '');

                    return !inline ? (
                      <CodeBlock
                        key={Math.random()}
                        language={(match && match[1]) || ''}
                        value={String(children).replace(/\n$/, '')}
                        {...props}
                      />
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  table({ children }) {
                    return (
                      <table className="border-collapse border border-black px-3 py-1 dark:border-white">
                        {children}
                      </table>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="break-words border border-black bg-gray-500 px-3 py-1 text-white dark:border-white">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="break-words border border-black px-3 py-1 dark:border-white">
                        {children}
                      </td>
                    );
                  },
                  a({ children, href }) {
                    return <a href={href} target="_blank" className="inline-flex">{children} <IconExternalLink size={20} /></a>
                  }
                }}
              >
                {`${message.content}${
                  messageIsStreaming && messageIndex == (selectedConversation?.messages.length ?? 0) - 1 ? '`▍`' : ''
                }`}
              </MemoizedReactMarkdown>

              <div className="md:-mr-8 md:ml-1 flex flex-col md:flex-row gap-4 md:gap-1 items-center md:items-start justify-end md:justify-start">
                {message.role === 'fileUpload' && (
                  <button
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    onClick={newThreadWithFiles}
                    title="Make a new conversation with all files in this conversation"
                    aria-label='New Thread With These Files'
                  >
                    <IconFileStack size={20} />
                  </button>
                )}
                {messagedCopied ? (
                  <IconCheck
                    size={20}
                    className="text-green-500 dark:text-green-400"
                  />
                ) : (
                  <button
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    onClick={copyOnClick}
                    title="Copy Message"
                    aria-label='Copy Message'
                  >
                    <IconCopy size={20} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
ChatMessage.displayName = 'ChatMessage';
