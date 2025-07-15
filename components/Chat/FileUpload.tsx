import {
  IconPaperclip
} from '@tabler/icons-react';
import {
  MouseEvent,
  useContext,
  useRef,
  useState,
} from 'react';

import HomeContext from '@/utils/home/home.context';

interface Props {
  onFileSelect: (files: File[]) => void;
  onCancelUpload: () => void;
}

export const FileUpload = ({
  onFileSelect,
  onCancelUpload,
}: Props) => {

  // const {
  //   state: { fileIsSelected },
  //   dispatch: homeDispatch,
  // } = useContext(HomeContext);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const dropRef = useRef(null);

  const handleDragOver = (event: { preventDefault: () => void; }) => {
    event.preventDefault();
  };

  // const handleDrop = (event: { preventDefault: () => void; dataTransfer: { selectedFiles: Iterable<unknown> | ArrayLike<unknown>; }; }) => {
  //   event.preventDefault();
  //   const newSelectedFiles = Array.from(event.dataTransfer.selectedFiles);
  //   setSelectedFiles([...selectedFiles, ...newSelectedFiles]);
  // };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSelectedFiles = Array.from(event.target.files || []);
    setSelectedFiles([...newSelectedFiles]);
    onFileSelect([...newSelectedFiles]);
  };

  const handleDeleteFile = (event: MouseEvent<HTMLSpanElement, MouseEvent>, fileIndex: number) => {
    console.log("delete file : " + fileIndex);
    const newSelectedFiles = [...selectedFiles];
    newSelectedFiles.splice(fileIndex, 1);
    setSelectedFiles([...newSelectedFiles]);
    onFileSelect([...newSelectedFiles]);
    onCancelUpload();
  }

  const handleUploadSelect = (event: MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const fileInput = document.getElementById("fileUploadButton") as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <>
    {(!selectedFiles || selectedFiles.length === 0) && (
      <>
          <label
        ref={dropRef as React.RefObject<HTMLLabelElement>}
        onDragOver={handleDragOver}
        className="absolute left-2 top-2 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200 cursor-pointer"
        title="Send"
        aria-label="Send"
      >
        <IconPaperclip size={18} />
        <input
          type="file"
          onChange={handleFileChange}
          multiple
          className="hidden"
        />
      </label>
      </>
      )}



    {selectedFiles && selectedFiles.length > 0 && (
      <ul className="space-y-2">
        {selectedFiles.map((file, index) => (
          <li
            key={index}
            className="inline-flex items-center bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm shadow-sm"
          >
            {file.name}
            <span
              onClick={(e) => handleDeleteFile(e, index)}
              className="ml-2 text-gray-500 hover:text-gray-700 cursor-pointer font-semibold"
            >
              ×
            </span>
          </li>
        ))}
      </ul>
    )}



    {/* {messageIsStreaming ? (

      
      <input type="file" id="fileUploadButton" className="fileUploadButton" accept=".pdf" onChange={handleFileSelect} />
      <input type="button" id="fileUploadButtonDisp" className="fileUploadButtonDisp" value="" onClick={handleUploadSelect} />
   
      {selectedFiles && selectedFiles.length > 0 && (
        <ul>
          {selectedFiles.map((file, index) => (
            // {inlineStyle = "padding: " + file.name.length + "px"}   style={{inlineStyle}}
            <li className="uploadFileName"  key={index}>{file.name} <span className="fileDel" onClick={(e) => handleDeleteFile(e, index)}>X</span></li>
          ))}
        </ul>
      )} */}
    </>
  );
}
