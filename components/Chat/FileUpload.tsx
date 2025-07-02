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
  MouseEvent,
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

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const dropRef = useRef(null);

  const handleDragOver = (event: { preventDefault: () => void; }) => {
    event.preventDefault();
  };

  const handleDrop = (event: { preventDefault: () => void; dataTransfer: { selectedFiles: Iterable<unknown> | ArrayLike<unknown>; }; }) => {
    event.preventDefault();
    const newSelectedFiles = Array.from(event.dataTransfer.selectedFiles);
    setSelectedFiles([...selectedFiles, ...newSelectedFiles]);
  };

  const handleFileSelect = (event: { target: { files: Iterable<unknown> | ArrayLike<unknown>; }; }) => {
    const newSelectedFiles = Array.from(event.target.files);
    //setSelectedFiles([...selectedFiles, ...newSelectedFiles]);
    setSelectedFiles([...newSelectedFiles]);


    console.log('newSelectedFiles:');
    for (const file of newSelectedFiles) {
      console.log('----Filename:', file.name);
    }

    console.log('selectedFiles:');
    for (const file of selectedFiles) {
      console.log('----Filename:', file.name);
    }

    //console.log("new files selected. old list: " + newSelectedFiles);
    //console.log("new list: " + selectedFiles);


    onFileSelect([...newSelectedFiles]);
  };

  const handleDeleteFile = (event: MouseEvent<HTMLSpanElement, MouseEvent>, fileIndex: number) => {
    console.log("delete file : " + fileIndex);
    const newSelectedFiles = [...selectedFiles];
    newSelectedFiles.splice(fileIndex, 1);
    setSelectedFiles(...newSelectedFiles);
    onFileSelect(...newSelectedFiles);
  }

  const handleUploadSelect = (event: MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const fileInput = document.getElementById("fileUploadButton") as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <div
      ref={dropRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}

      className="absolute left-2 top-2 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
    >
      
      <input type="file" id="fileUploadButton" className="fileUploadButton" accept=".pdf" onChange={handleFileSelect} />
      {/* <label htmlFor="fileUploadButton">Select file</label> */}
      <input type="button" id="fileUploadButtonDisp" className="fileUploadButtonDisp" value="" onClick={handleUploadSelect} />
   
      {selectedFiles && selectedFiles.length > 0 && (
        <ul>
          {selectedFiles.map((file, index) => (
            <li className="uploadFileName" key={index}>{file.name} <span className="fileDel" onClick={(e) => handleDeleteFile(e, index)}>X</span></li>
          ))}
        </ul>
      )}
    </div>
  );


}






