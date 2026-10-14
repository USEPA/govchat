import { IconFileImport } from '@tabler/icons-react';
import { FC, useRef } from 'react';

import { useTranslation } from 'next-i18next';

import { SidebarButton } from '@/components/Sidebar/SidebarButton';

import { useImportHistory } from '@/hooks/useImportHistory';

export const ImportConversations: FC = () => {
  const { t } = useTranslation('sidebar');
  const inputRef = useRef<HTMLInputElement>(null);

  const importHistory = useImportHistory();

  return (
    <>
      <input
        ref={inputRef}
        className="sr-only"
        tabIndex={-1}
        type="file"
        accept=".json"
        title="Import conversations"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) importHistory(file);
        }}
      />
      <SidebarButton
        text={t('Import conversations')}
        icon={<IconFileImport size={18} />}
        onClick={() => inputRef.current?.click()}
      />
    </>
  );
};
