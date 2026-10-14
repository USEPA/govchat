import { FC, MouseEvent } from 'react';

import { exportData } from '@/utils/app/importExport';

interface Props {
  filename?: string;
  className?: string;
}

export const DownloadLocalStorage: FC<Props> = ({
  filename = 'localStorage.json',
  className = 'cursor-pointer text-sm text-blue-500 underline hover:text-blue-700',
}) => {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    exportData(filename);
  };

  return (
    <a href="#" onClick={handleClick} className={className}>
      Download data
    </a>
  );
};
