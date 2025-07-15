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

  const handleDeleteFile = (event: React.MouseEvent<HTMLSpanElement>, fileIndex: number) => {
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
          accept='.c, .cpp, .cs, .doc, .docx, .go, .java, .js, .json, .md, .pdf, .php, .pptx, .py, .ts, .txt'
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


    </>
  );
}
