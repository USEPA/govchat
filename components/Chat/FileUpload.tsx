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

  const handleDeleteFile = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>, fileIndex: number) => {
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
        accept='.c, .cpp, .cs, .doc, .docx, .go, .java, .js, .json, .md, .pdf, .php, .pptx, .py, .ts, .txt'
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
  filesLeftToUpload,
}: Props) => {


  const deleteFiles = () => {
    setUploadFiles([]);
    onCancelUpload();
  }

  if (filesLeftToUpload) {
    return (
<div className="w-full bg-blue-100 p-3 border-b border-blue-300">
  <span className="text-blue-800 font-medium">
    Uploading Files...
  </span>
</div>

    )
  } else if (uploadFiles.length > 0) {
    return (
      <div className="w-full bg-gray-100 p-3 border-b">
        <span className="text-gray-800">
          {uploadFiles.length === 1 ? (
            <>
                1 file will be sent with the prompt:&nbsp;
                <span className="font-medium">
                  {uploadFiles[0].name.length > 20
                    ? `${uploadFiles[0].name.slice(0, 20)}...`
                    : uploadFiles[0].name}
                </span>
            </>
          ) : (
            <>
              {uploadFiles.length} files will be sent with the prompt
            </>
          )}

          <button
            onClick={() => deleteFiles()}
            className="ml-4 px-3 py-1 text-sm text-black border border-black rounded hover:bg-black/10 transition"

          >
            Remove Files
          </button>
        </span>
      </div>
    )} else {
      return <></>
    }
}
