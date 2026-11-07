import { passivePreferenceCatalog, type PassiveOptimizationSettings, type PassivePreferenceId } from "../tree/passivePreferences";
import { ControlTooltip } from "./ControlTooltip";
import { maxPassiveAllocationPointCount } from "../tree/passivePointBudget";

type Props = { settings: PassiveOptimizationSettings; onChange: (settings: PassiveOptimizationSettings) => void; disabled: boolean; mainPointLimit?: number };

export function PassivePreferenceControls({ settings, onChange, disabled, mainPointLimit = maxPassiveAllocationPointCount }: Props) {
  return (
    <div className="passive-preferences">
      <ControlTooltip id="optimizer-mode-tooltip" block text={<>
        <strong>Route objective</strong>
        <p>Shortest keeps the existing fewest-points search.</p>
        <p>Passive preferences rewards selected unconditional effects on new nodes, including nearby branches. Every build goal remains required.</p>
        <p>Preference scores are relative priorities, not Full DPS or total defence. Conditional effects, gear interactions and unselected effects are not valued. Review the route before applying.</p>
      </>}>
        <fieldset className="optimizer-mode" disabled={disabled} aria-describedby="optimizer-mode-tooltip">
          <legend>Route objective</legend>
          <label><input type="radio" name="route-objective" checked={settings.mode === "shortest"} onChange={() => onChange({ ...settings, mode: "shortest" })} />Shortest</label>
          <label><input type="radio" name="route-objective" checked={settings.mode === "weighted"} onChange={() => onChange({ ...settings, mode: "weighted" })} />Passive preferences</label>
        </fieldset>
      </ControlTooltip>
      {settings.mode === "weighted" ? <>
        <ControlTooltip id="point-budget-mode-tooltip" block text={<>
          <strong>Point budget</strong>
          <p>Extra points limits detours relative to the shortest baseline found.</p>
          <p>Use all available lets the optimizer spend the remaining character points, up to {maxPassiveAllocationPointCount} total. Existing main points and the larger weapon-set allocation are accounted for; ascendancy points are separate.</p>
          <p>Only useful matching branches are added. Points may remain unused when no beneficial branch fits.</p>
        </>}>
          <div className="point-budget-mode">
            <label htmlFor="point-budget-mode">Point budget</label>
            <select id="point-budget-mode" value={settings.pointBudgetMode ?? "extra"} disabled={disabled} aria-describedby="point-budget-mode-tooltip"
              onChange={(event) => onChange({ ...settings, pointBudgetMode: event.currentTarget.value as "extra" | "all-available" })}>
              <option value="extra">Extra points</option>
              <option value="all-available">{`Use all available (${maxPassiveAllocationPointCount} total)`}</option>
            </select>
          </div>
        </ControlTooltip>
        {settings.pointBudgetMode === "all-available" ? (
          mainPointLimit < maxPassiveAllocationPointCount ? <p className="point-budget-reserve" role="note">{`${maxPassiveAllocationPointCount - mainPointLimit} points reserved for weapon sets.`}</p> : null
        ) : (
        <ControlTooltip id="extra-point-budget-tooltip" block text={<>
          <strong>Extra-point budget</strong>
          <p>Maximum added nodes = shortest baseline found + this budget. Already allocated nodes are free and cannot be removed.</p>
          <p>Zero allows alternative routes at the baseline cost. Large goal sets use a shortest baseline found, not a proven minimum. This is not the total character point limit.</p>
        </>}>
          <div className="extra-point-budget">
            <label htmlFor="extra-point-budget">Extra points</label>
            <div className="extra-point-stepper" role="group" aria-label="Extra-point allowance">
              <button className="tool-button" type="button" aria-label="Decrease extra points" title="Decrease extra points"
                disabled={disabled || settings.extraPointBudget <= 0} onClick={() => onChange({ ...settings, extraPointBudget: Math.max(0, settings.extraPointBudget - 1) })}>-</button>
            <input id="extra-point-budget" type="number" min={0} max={maxPassiveAllocationPointCount} step={1} value={settings.extraPointBudget} disabled={disabled}
              aria-describedby="extra-point-budget-tooltip"
              onChange={(event) => onChange({ ...settings, extraPointBudget: Number(event.currentTarget.value) })} />
              <button className="tool-button" type="button" aria-label="Increase extra points" title="Increase extra points"
                disabled={disabled || settings.extraPointBudget >= maxPassiveAllocationPointCount} onClick={() => onChange({ ...settings, extraPointBudget: Math.min(maxPassiveAllocationPointCount, settings.extraPointBudget + 1) })}>+</button>
            </div>
          </div>
        </ControlTooltip>
        )}
        <ul className="passive-preference-list" aria-label="Selected passive preferences">
          {settings.preferences.map((preference) => {
            const effect = passivePreferenceCatalog.find((effect) => effect.id === preference.id)!;
            return <li key={preference.id}>
              <ControlTooltip id={`preference-${effect.id}-tooltip`} text={`At normal priority, 1 score per ${effect.unit}. Higher priority multiplies this by 2 or 3. Only supported unconditional effects count.`}>
                <span className="passive-preference-name" tabIndex={0} aria-describedby={`preference-${effect.id}-tooltip`}>{effect.label}</span>
              </ControlTooltip>
              <select aria-label={`${effect.label} priority`} value={preference.weight} disabled={disabled}
                onChange={(event) => onChange({ ...settings, preferences: settings.preferences.map((current) => current.id === effect.id ? { ...current, weight: Number(event.currentTarget.value) } : current) })}>
                <option value={1}>Normal</option><option value={2}>High</option><option value={3}>Highest</option>
              </select>
              <button className="tool-button" type="button" aria-label={`Remove ${effect.label} preference`} disabled={disabled}
                onClick={() => onChange({ ...settings, preferences: settings.preferences.filter((current) => current.id !== effect.id) })}>Remove</button>
            </li>;
          })}
        </ul>
        <label className="passive-preference-picker" htmlFor="add-passive-preference">Add effect preference</label>
        <select id="add-passive-preference" value="" disabled={disabled || settings.preferences.length === passivePreferenceCatalog.length}
          onChange={(event) => {
            const id = event.currentTarget.value as PassivePreferenceId;
            if (id && !settings.preferences.some((preference) => preference.id === id)) onChange({ ...settings, preferences: [...settings.preferences, { id, weight: 1 }] });
          }}>
          <option value="" disabled>Choose an effect...</option>
          {["Defence", "Offence", "Utility"].map((group) => <optgroup key={group} label={group}>
            {passivePreferenceCatalog.filter((effect) => effect.group === group && !settings.preferences.some((preference) => preference.id === effect.id))
              .map((effect) => <option key={effect.id} value={effect.id}>{effect.label}</option>)}
          </optgroup>)}
        </select>
      </> : null}
    </div>
  );
}
