import { passivePreferenceCatalog, type PassivePreference, type PassivePreferenceId } from "../tree/passivePreferences";
import { InfoTooltip } from "./ControlTooltip";
import { SearchablePicker, type PickerOption } from "./SearchablePicker";

type Props = { preferences: readonly PassivePreference[]; onToggle: (id: PassivePreferenceId, selected: boolean) => void; disabled: boolean };
const options: PickerOption[] = ["Defence", "Offence", "Utility"].flatMap(group =>
  passivePreferenceCatalog.filter(effect => effect.group === group).map(effect => ({ value: effect.id, label: effect.label, group })));

export function PassiveEffectPicker({ preferences, onToggle, disabled }: Props) {
  return <div className="effect-preference-picker">
    <span className="label-with-info">
      <label className="passive-preference-picker" htmlFor="add-passive-preference">Add effect preference</label>
      <InfoTooltip id="effect-picker-tooltip" label="About effect search">
        <p>Open the dropdown to search effect names. All words must match, in any order.</p>
        <p>Check or uncheck effects to add or remove them. The popup stays open for multiple choices. Existing priorities stay unchanged; newly added effects start at Normal.</p>
        <p>Arrow keys navigate. Done, Escape or clicking outside closes the popup. Goals and point budgets are unchanged.</p>
      </InfoTooltip>
    </span>
    <SearchablePicker id="add-passive-preference" label="Add effect preference" searchLabel="Search effects" options={options}
      selectedValues={preferences.map(preference => preference.id)} multiple placeholder="Choose effects" disabled={disabled}
      describedBy="effect-picker-tooltip" onSelect={(id, selected) => onToggle(id as PassivePreferenceId, selected)} />
  </div>;
}
