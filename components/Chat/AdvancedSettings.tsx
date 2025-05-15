import { useState, FC } from 'react';
import { TemperatureSlider } from './Temperature';
import { SystemPrompt } from './SystemPrompt';
import { Conversation } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { Prompt } from '@/types/prompt';
import { ModelSelect } from './ModelSelect';

const SUPPORTS_TEMPERATURE = [
  "GPT-4"
]

interface Props {
    selectedConversation: Conversation,
    prompts: Prompt[],
    handleUpdateConversation: (
        conversation: Conversation,
        data: KeyValuePair,
      ) => void,
    t: any,
    onToggle: (showAdvanced: boolean) => void;
  }

export const AdvancedSettings: FC<Props> = ({ selectedConversation, prompts, handleUpdateConversation, t, onToggle }) => {
  // State to manage visibility of the advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);

  let prodFlag = false;
  let stagingFlag = false;
  if (typeof window !== 'undefined' && window.__MODEL_SELECT_FLAGS__) {
    prodFlag = window.__MODEL_SELECT_FLAGS__.prod;
    stagingFlag = window.__MODEL_SELECT_FLAGS__.stage;
  }
  const showModelSelect = prodFlag || (stagingFlag && window.location.hostname === 'govchat-web-app.govchat-stg-asev3.appserviceenvironment.net');

  const toggleAdvancedSettings = () => {
    const newShowAdvanced = !showAdvanced;
    setShowAdvanced(newShowAdvanced);
    onToggle(newShowAdvanced); // Notify parent about the state change
  };

  return (
    <div className="mt-4">
      {/* Toggle button */}
      <button
        onClick={toggleAdvancedSettings}
        className="flex items-center justify-between w-full p-3 hover:bg-gray-500/5 text-black/80 border border-neutral-200 rounded-lg"
        title="Toggle Advanced Settings"
        aria-label='Toggle Advanced Settings'
      >
        <span>Advanced Settings</span>
        <span className={`transition-transform ${showAdvanced ? 'rotate-180' : 'rotate-0'}`}>
          {/* Arrow to indicate toggle, rotates when open */}
          ▼
        </span>
      </button>

      {/* Advanced settings content */}
      {showAdvanced && (
        <div className="mt-4 space-y-4">
          {/* SystemPrompt component */}
          {showModelSelect && <ModelSelect />}
          <SystemPrompt
            conversation={selectedConversation}
            prompts={prompts}
            onChangePrompt={(prompt) =>
              handleUpdateConversation(selectedConversation, {
                key: 'prompt',
                value: prompt,
              })
            }
          />
          {/* TemperatureSlider component */}
          <TemperatureSlider
            label={t('Temperature')}
            onChangeTemperature={(temperature) =>
              handleUpdateConversation(selectedConversation, {
                key: 'temperature',
                value: temperature,
              })
            }
            disabled={!SUPPORTS_TEMPERATURE.includes(selectedConversation?.model.name || '')}
          />
        </div>
      )}
    </div>
  );
}