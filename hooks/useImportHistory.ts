import { useCallback, useContext } from 'react';
import toast from 'react-hot-toast';

import { importData, parseImportFile } from '@/utils/app/importExport';

import HomeContext from '@/utils/home/home.context';

export const useImportHistory = () => {
  const {
    state: { conversations },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  return useCallback(
    async (file: File) => {
      try {
        const {
          history: merged,
          folders: mergedFolders,
          prompts: mergedPrompts,
        } = importData(parseImportFile(await file.text()));
        homeDispatch({ field: 'conversations', value: merged });
        homeDispatch({ field: 'folders', value: mergedFolders });
        homeDispatch({ field: 'prompts', value: mergedPrompts });
        toast.success(
          `Imported ${merged.length - conversations.length} conversation(s)`,
        );
      } catch {
        toast.error('Could not read the file');
      }
    },
    [conversations, homeDispatch],
  );
};
