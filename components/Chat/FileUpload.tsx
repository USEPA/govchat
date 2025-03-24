import {
  IconArrowDown,
  IconBolt,
  IconBrandGoogle,
  IconPlayerStop,
  IconRepeat,
  IconSend,
} from '@tabler/icons-react';
import {
  KeyboardEvent,
  MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useTranslation } from 'next-i18next';

import { Message, Conversation } from '@/types/chat';
import { Plugin } from '@/types/plugin';
import { Prompt } from '@/types/prompt';

import HomeContext from '@/utils/home/home.context';

import { PluginSelect } from './PluginSelect';
import { PromptList } from './PromptList';
import { VariableModal } from './VariableModal';



interface Props {
  onSend: (message: Message, plugin: Plugin | null) => void;
  onRegenerate: () => void;
  onScrollDownClick: () => void;
  stopConversationRef: MutableRefObject<boolean>;
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>;
  showScrollDownButton: boolean;
}

export const FileUpload = ({
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

  const [content, setContent] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showPromptList, setShowPromptList] = useState(false);


  const chatSection = document.getElementById("chat-section");
  const uploadButton = document.getElementById("upload-button");
  const chatInput = document.getElementById("chat-input");
  const sendButton = document.getElementById("send-button");

  //function handleFileSelection() {
  //  const fileInput = document.getElementById("file-input");
  //  if (fileInput.files.length > 0) {
  //    uploadButton.style.display = "inline-block";
  //  } else {
  //    uploadButton.style.display = "none";
  //  }
  //}

  //async function uploadFile() {
  //  const fileInput = document.getElementById("file-input");
  //  const file = fileInput.files[0];

  //  if (!file) {
  //    alert("No file selected!");
  //    return;
  //  }

  //  const formData = new FormData();
  //  formData.append("file", file);

  //  try {
  //    const response = await fetch("/upload", {
  //      method: "POST",
  //      body: formData,
  //    });

  //    if (!response.ok) {
  //      throw new Error("File upload failed!");
  //    }

  //    const result = await response.json();
  //    console.log("File uploaded successfully: " + result.filename);

  //    // Enable chat input and send button after upload completes
  //    chatInput.disabled = false;
  //    sendButton.disabled = false;

  //    // Reset file input and upload button
  //    fileInput.value = "";
  //    uploadButton.style.display = "none";
  //  } catch (error) {
  //    alert("Error uploading file: " + error.message);
  //  }
  //}

  //function sendMessage() {
  //  const message = chatInput.value.trim();

  //  if (message) {
  //    displayMessage(message, "user");
  //    chatInput.value = "";
  //  }
  //}

  //function displayMessage(message, sender) {
  //  const messageDiv = document.createElement("div");
  //  messageDiv.classList.add("message", sender);
  //  messageDiv.textContent = message;
  //  chatSection.appendChild(messageDiv);
  //  chatSection.scrollTop = chatSection.scrollHeight; // Scroll to the bottom
  //}


  /*

<div id="existing-file"></div>
<div className="file-upload">
  <label htmlFor="file-input">Upload CSV:</label>
  <input
    type="file"
    id="file-input"
    accept=".csv"
    onChange={handleFileSelection}
  />
  <button id="upload-button" onClick={uploadFile}>
    Upload
  </button>
</div>  
  */



}






