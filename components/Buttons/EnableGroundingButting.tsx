import { IconWorldSearch } from "@tabler/icons-react";

interface Props {
  enabled: boolean;
  onToggle: () => void;
}

const EnableGroundingButton = ({ onToggle, enabled }: Props) => {
	return (
		<span>
			<button
				onClick={onToggle}
				className={`inline-block ml-1 mt-2 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200 cursor-pointer ${
					enabled ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-200' : ''
				}`}
				title={enabled ? 'Disable Grounding' : 'Enable Grounding'}
				aria-label={enabled ? 'Disable Grounding' : 'Enable Grounding'}
			>
				<IconWorldSearch size={18} />
			</button>
		</span>
	)
};

export default EnableGroundingButton;