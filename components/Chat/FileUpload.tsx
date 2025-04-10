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

    onFileSelect(files);

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
      <p>Drag and drop pdf files here or</p>
      <input type="file" accept=".pdf" multiple onChange={handleFileSelect} />
      {files.length > 0 && (
        <ul>
          {files.map((file, index) => (
            <li className="uploadFileName" key={index}>{file.name} <span className="fileDel" onClick={(e) => handleDeleteFile(e, index)}>X</span></li>
          ))}
        </ul>
      )}
    </div>
  );


}






