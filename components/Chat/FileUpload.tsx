import {
  IconPaperclip
} from '@tabler/icons-react';
import {
  MouseEvent,
} from 'react';


interface Props {
  uploadFiles: File[];
  setUploadFiles: (files: File[]) => void;
  onCancelUpload: () => void;
}

export const FileUploadButton = ({
  uploadFiles,
  setUploadFiles,
  onCancelUpload,
}: Props) => {

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadFiles(Array.from(event.target.files || []));
  };

  const handleDeleteFile = (event: MouseEvent<HTMLSpanElement, MouseEvent>, fileIndex: number) => {
    event.stopPropagation();
    setUploadFiles([...uploadFiles].splice(fileIndex, 1));
    onCancelUpload();
  }

  if (!uploadFiles || uploadFiles.length === 0) {
    return (
      <span>
      <label
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
      </span>
      )
  } else { return <span></span>}
}


export const FileUploadListing = ({
  uploadFiles,
  setUploadFiles,
  onCancelUpload,
}: Props) => {


  const deleteFiles = () => {
    setUploadFiles([]);
    onCancelUpload();
  }

  if (uploadFiles.length > 0) {
    return (
      <div className="w-full bg-gray-100 p-3">
            <span className="text-gray-800">
            {uploadFiles.length} files will be sent with prompt
            <span
              onClick={(e) => deleteFiles()}
              className="ml-2 text-gray-500 hover:text-gray-700 cursor-pointer font-semibold"
            >×</span>
            </span>

    </div>
    )} else {
      return <></>
    }
}
