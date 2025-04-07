import {
  IconArrowDown,
  IconBolt,
  IconBrandGoogle,
  IconPlayerStop,
  IconRepeat,
  IconSend,
  IconFileUpload
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
  onFileSelect: () => void;
}

export const FileUpload = ({
  onFileSelect,
}: Props) => {

  const {
    state: { fileIsSelected },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const uploadButton = document.getElementById("upload-button");

  const handleFileSelection = () => {
  //  const fileInput = document.getElementById("file-input");
  //  if (fileInput.files.length > 0) {
  //    uploadButton.style.display = "inline-block";
  //  } else {
  //    uploadButton.style.display = "none";
  //  }
  }


  const handleFileUpload = () => {
  }
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


  const [files, setFiles] = useState([]);
  const dropRef = useRef(null);

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const newFiles = Array.from(event.dataTransfer.files);
    setFiles([...files, ...newFiles]);
  };

  const handleFileSelect = (event) => {
    const newFiles = Array.from(event.target.files);
    setFiles([...files, ...newFiles]);
  };

  const handleDeleteFile = (event, fileIndex) => {
    console.log("delete file : " + fileIndex);
    const newFiles = [...files];
    newFiles.splice(fileIndex, 1);
    setFiles(newFiles);
  }

  return (
    <div
      ref={dropRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ border: '2px dashed #ccc', padding: '0px', textAlign: 'center' }}
    >
      <p>Drag and drop files here or</p>
      <input type="file" multiple onChange={handleFileSelect} />
      {files.length > 0 && (
        <ul>
          {files.map((file, index) => (
            <li className="uploadFileName" key={index}>{file.name} <span className="fileDel" onClick={(e) => handleDeleteFile(e, index)}>X</span></li>
          ))}
        </ul>
      )}
    </div>
  );

  /*

  return (
    <button
      className="absolute right-8 top-2 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
      onClick={handleFileUpload}
      title="Upload File"
      aria-label='Upload File'
    >
      {
        fileIsSelected ? (
        <div className="h-4 w-4 rounded-full border-t-2 border-neutral-800 opacity-60 dark:border-neutral-100">FILE_NAME</div>
      ) : (
        <IconFileUpload size={20} />
      )}
    </button>

  )



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






