import type { ReactNode } from "react";
import { skillPreferencePresets } from "../tree/skillPreferencePresets";
import { InfoTooltip } from "./ControlTooltip";
import { SearchablePicker, type PickerOption } from "./SearchablePicker";

type Props = { value: string; onChange: (id: string) => void; disabled: boolean; help: ReactNode };
const options: PickerOption[] = [
  { value: "", label: "None (manual preferences)", alwaysVisible: true },
  ...skillPreferencePresets.map(skill => ({ value: skill.id, label: skill.name })),
];

export function SkillFocusPicker({ value, onChange, disabled, help }: Props) {
  const current = skillPreferencePresets.find(skill => skill.id === value);
  return <div className="focus-skill-picker searchable-skill-picker">
    <span className="label-with-info">
      <label htmlFor="focus-skill">Skill</label>
      <InfoTooltip id="focus-skill-tooltip" label={current ? `About ${current.name}` : "About skill focus"}>
        {help}<p>Open the dropdown to search by name. Arrow keys navigate and Enter selects. Escape closes without changing the skill.</p>
      </InfoTooltip>
    </span>
    <SearchablePicker id="focus-skill" label="Skill" searchLabel="Search skills" options={options} selectedValues={[value]}
      disabled={disabled} describedBy="focus-skill-tooltip" resetKey={value} onSelect={id => { if (id !== value) onChange(id); }} />
  </div>;
}
