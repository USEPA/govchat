import { IconExternalLink, IconFolderPlus, IconMistOff, IconPlus } from '@tabler/icons-react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
  CloseSidebarButton,
  OpenSidebarButton,
} from './components/OpenCloseButton';

import Search from '../Search';
import { Logo } from '../Chat/logo';

interface Props<T> {
  isOpen: boolean;
  addItemButtonTitle: string;
  side: 'left' | 'right';
  items: T[];
  itemComponent: ReactNode;
  folderComponent: ReactNode;
  footerComponent?: ReactNode;
  searchTerm: string;
  handleSearchTerm: (searchTerm: string) => void;
  toggleOpen: () => void;
  handleCreateItem: () => void;
  handleCreateFolder: () => void;
  handleDrop: (e: any) => void;
}

const Sidebar = <T,>({
  isOpen,
  addItemButtonTitle,
  side,
  items,
  itemComponent,
  folderComponent,
  footerComponent,
  searchTerm,
  handleSearchTerm,
  toggleOpen,
  handleCreateItem,
  handleCreateFolder,
  handleDrop,
}: Props<T>) => {
  const { t } = useTranslation('promptbar');

  const allowDrop = (e: any) => {
    e.preventDefault();
  };

  const highlightDrop = (e: any) => {
    e.target.style.background = '#343541';
  };

  const removeHighlight = (e: any) => {
    e.target.style.background = 'none';
  };

  return isOpen ? (
    <div>
      <div
        className={`fixed top-0 ${side}-0 z-40 flex h-full w-[260px] flex-none flex-col space-y-2 bg-white p-2 text-[14px] border border-neutral-200 transition-all sm:relative sm:top-0`}
      >
        <div className="text-black text-[8pt]">
            <span className="mb-1 font-bold">Information About: </span>
            <a className="underline" href="https://work.epa.gov/data/artificial-intelligence-epa-basic-information">AI</a> |&nbsp;
            <a className="underline" href="https://work.epa.gov/data/artificial-intelligence-epa-generative-ai">Generative AI</a>
        </div>

        <div className="text-black text-[8pt]">
            <span className="mb-1 font-bold">AI: </span>
            <a className="underline" href="https://work.epa.gov/data/artificial-intelligence-epa-ai-use-cases">Use Cases</a> |&nbsp;
            <a className="underline" href="https://work.epa.gov/data/artificial-intelligence-epa-training-and-events">Training</a> |&nbsp;
            <a className="underline" href="https://work.epa.gov/data/artificial-intelligence-epa-resources">Resources</a><br/>
            <a className="underline" href="https://work.epa.gov/data/artificial-intelligence-epa-ai-community">Community of Practice</a> |&nbsp;
            <a className="underline" href="https://work.epa.gov/data/artificial-intelligence-epa-government-use">Government Use</a>
        </div>

        <div className="flex items-center">
          <button
            className="text-sidebar flex h-[42px] w-[190px] flex-shrink-0 cursor-pointer select-none items-center gap-3 rounded-md border border-neutral-200 p-3 text-black  transition-colors duration-200 hover:bg-gray-500/10"
            onClick={() => {
              handleCreateItem();
              handleSearchTerm('');
            }}
            title="Add Item"
          >
            <IconPlus size={16} />
            {addItemButtonTitle}
          </button>

          <button
            className="h-[42px] ml-2 flex flex-shrink-0 cursor-pointer items-center gap-3 rounded-md border border-neutral-200 p-3 text-black transition-colors duration-200 hover:bg-gray-500/10"
            onClick={handleCreateFolder}
            title="Create Folder"
            aria-label="Create Folder"
          >
            <IconFolderPlus size={16} />
          </button>
        </div>
        <Search
          placeholder={t('Search...') || ''}
          searchTerm={searchTerm}
          onSearch={handleSearchTerm}
        />

        <div className="flex-grow overflow-auto">
          {items?.length > 0 && (
            <div className="flex border-b border-neutral-200 pb-2">
              {folderComponent}
            </div>
          )}

          {items?.length > 0 ? (
            <div
              className="pt-2"
              onDrop={handleDrop}
              onDragOver={allowDrop}
              onDragEnter={highlightDrop}
              onDragLeave={removeHighlight}
            >
              {itemComponent}
            </div>
          ) : (
            <div className="mt-8 select-none text-center text-black opacity-50">
              <IconMistOff className="mx-auto mb-3" />
              <span className="text-[14px] leading-normal">
                {t('No data.')}
              </span>
            </div>
          )}
        </div>
        {footerComponent}
      </div>

      <CloseSidebarButton onClick={toggleOpen} side={side} />
    </div>
  ) : (
    <OpenSidebarButton onClick={toggleOpen} side={side} />
  );
};

export default Sidebar;
