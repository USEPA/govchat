import { IconWorldSearch } from "@tabler/icons-react";

interface Props {
  enabled: boolean;
  onToggle: () => void;
}

const EnableGroundingButton = ({ onToggle, enabled }: Props) => {
	return (
		<>
			<input type="checkbox" id="enable-grounding" className="btn-check" checked={enabled} onClick={onToggle} />
			<label className={`ml-1 mt-2 rounded-sm p-1 btn`} htmlFor="enable-grounding" title={enabled ? 'Disable Grounding' : 'Enable Grounding'}>
				<IconWorldSearch size={18} />
				<span className="sr-only">{enabled ? 'Disable Grounding' : 'Enable Grounding'}</span>
			</label>
		</>
	)
};

export default EnableGroundingButton;