import { SupportedExportFormats } from '@/types/export';
import { PluginKey } from '@/types/plugin';
import { IconFileExport, IconMoon, IconPictureInPictureOff, IconPictureInPictureOn, IconSun, IconToggleRight } from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';
import { FC } from 'react';
import { Import } from '../Settings/Import';
import { Key } from '../Settings/Key';
import { SidebarButton } from '../Sidebar/SidebarButton';
import { ClearConversations } from './ClearConversations';
import { PluginKeys } from './PluginKeys';
import { IconToggleLeft } from '@tabler/icons-react';

interface Props {
  lightMode: 'light' | 'dark';
  apiKey: string;
  pluginKeys: PluginKey[];
  conversationsCount: number;
  onToggleLightMode: (mode: 'light' | 'dark') => void;
  onApiKeyChange: (apiKey: string) => void;
  onClearConversations: () => void;
  onExportConversations: () => void;
  onImportConversations: (data: SupportedExportFormats) => void;
  onPluginKeyChange: (pluginKey: PluginKey) => void;
  onClearPluginKey: (pluginKey: PluginKey) => void;
  onToggleUseRAG: (useRAG: 'true' | 'false') => void;
  useRAG: 'true' | 'false'
}

export const ChatbarSettings: FC<Props> = ({
  lightMode,
  apiKey,
  pluginKeys,
  conversationsCount,
  onToggleLightMode,
  onApiKeyChange,
  onClearConversations,
  onExportConversations,
  onImportConversations,
  onPluginKeyChange,
  onClearPluginKey,
  onToggleUseRAG,
  useRAG
}) => {
  const { t } = useTranslation('sidebar');

  return (
    <div className="flex flex-col items-center space-y-1 border-t border-white/20 pt-1 text-sm">
      {conversationsCount > 0 ? (
        <ClearConversations onClearConversations={onClearConversations} />
      ) : null}

      {/* <Import onImport={onImportConversations} /> */}

      <SidebarButton
        text={t('Export data')}
        icon={<IconFileExport size={18} />}
        onClick={() => onExportConversations()}
      />

      <SidebarButton
        text={lightMode === 'light' ? t('Dark mode') : t('Light mode')}
        icon={
          lightMode === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />
        }
        onClick={() =>
          onToggleLightMode(lightMode === 'light' ? 'dark' : 'light')
        }
      />
      <SidebarButton
        text={useRAG === 'true' ? t('Use RAG') : t('Not use RAG')}
        icon={
          useRAG === 'true' ? <IconToggleRight size={18} /> : <IconToggleLeft size={18} />
        }
        onClick={() =>
          onToggleUseRAG(useRAG === 'true' ? 'false' : 'true')
        }
      />{process.env.NODE_ENV !== "production" && (
        <>
          <Key apiKey={apiKey} onApiKeyChange={onApiKeyChange} /></>)}


      {/* <PluginKeys
        pluginKeys={pluginKeys}
        onPluginKeyChange={onPluginKeyChange}
        onClearPluginKey={onClearPluginKey}
      /> */}
    </div>
  );
};
