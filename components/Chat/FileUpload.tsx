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

  const [selectedFiles, setSelectedFiles] = useState([]);
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

  const handleDeleteFile = (event: MouseEvent<HTMLSpanElement, MouseEvent>, fileIndex: string | number) => {
    console.log("delete file : " + fileIndex);
    const newSelectedFiles = [...selectedFiles];
    newSelectedFiles.splice(fileIndex, 1);
    setSelectedFiles(...newSelectedFiles);
    onFileSelect(...newSelectedFiles);
  }

  return (
    <div
      ref={dropRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ border: '2px dashed #ccc', padding: '0px', textAlign: 'center' }}
    >
      <p>Drag and drop pdf files here or</p>
      <input type="file" accept=".pdf" multiple onChange={handleFileSelect} />
      {selectedFiles.length > 0 && (
        <ul>
          {selectedFiles.map((file, index) => (
            <li className="uploadFileName" key={index}>{file.name} <span className="fileDel" onClick={(e) => handleDeleteFile(e, index)}>X</span></li>
          ))}
        </ul>
      )}
    </div>
  );


}






