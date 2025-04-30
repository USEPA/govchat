import { FC, useContext, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { DEFAULT_TEMPERATURE } from '@/utils/app/const';

import HomeContext from '@/utils/home/home.context';
import { IconAlertCircle } from '@tabler/icons-react';

interface Props {
  label: string;
  onChangeTemperature: (temperature: number) => void;
  disabled: boolean;
}

export const TemperatureSlider: FC<Props> = ({
  label,
  onChangeTemperature,
  disabled
}) => {
  const {
    state: { conversations },
  } = useContext(HomeContext);
  const lastConversation = conversations[conversations.length - 1];
  const [temperature, setTemperature] = useState(
    lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
  );
  const { t } = useTranslation('chat');
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    setTemperature(newValue);
    onChangeTemperature(newValue);
  };

  return (
    <div className="flex flex-col">
      <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">
        {label}
      </label>
      {disabled && (
        <span className="flex items-center gap-2 mb-2 text-[12px] text-sm text-black/70 dark:text-white/50">
          <IconAlertCircle size={36} />
          Disabled control: currently only the default model (GPT-4) supports adjusting the temperature.
        </span>
      )}
      <span className={"text-[12px] dark:text-white/50 text-sm " + (disabled ? "text-black/20" : "text-black/70")}>
      Lower values are more focused and deterministic, higher ones are more creative and random.
      </span>
      <span className={("mt-2 mb-1 text-center dark:text-neutral-100 " + (disabled ? "text-neutral-200" : "text-neutral-900"))}>
        {temperature.toFixed(1)}
      </span>
      <input
        className="cursor-pointer text-black"
        type="range"
        min={0}
        max={1}
        step={0.1}
        value={temperature}
        onChange={handleChange}
        disabled={disabled}
        title="Change Model Temperature"
        aria-label="Change Model Temperature"
      />
      <ul className={"w mt-2 pb-8 flex justify-between px-[24px] dark:text-neutral-100 " + (disabled ? "text-neutral-200" : "text-neutral-900")}>
        <li className="flex justify-center relative">
          <span className="absolute">{t('Precise')}</span>
        </li>
        <li className="flex justify-center relative">
          <span className="absolute">{t('Neutral')}</span>
        </li>
        <li className="flex justify-center relative">
          <span className="absolute">{t('Creative')}</span>
        </li>
      </ul>
    </div>
  );
};
