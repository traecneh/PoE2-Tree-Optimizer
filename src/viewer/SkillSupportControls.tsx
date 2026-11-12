import { memo, useMemo, useState } from "react";
import { passivePreferenceCatalog, type PassiveOptimizationSettings } from "../tree/passivePreferences";
import type { SkillPreferencePreset } from "../tree/skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, reviewedSkillSupportsFor, setSkillSupport, skillSupportPriorityChanges } from "../tree/skillSupportPreferences";
import { ControlTooltip, InfoTooltip } from "./ControlTooltip";

type Props = {
  preset: SkillPreferencePreset;
  settings: PassiveOptimizationSettings;
  onChange: (settings: PassiveOptimizationSettings) => void;
  disabled: boolean;
};

export function SkillSupportControls(props: Props) {
  return <SkillSupportPicker key={props.preset.id} {...props} />;
}

function SkillSupportPicker({ preset, settings, onChange, disabled }: Props) {
  const [query, setQuery] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const supports = useMemo(() => reviewedSkillSupportsFor(preset.id, settings.supportGemIds), [preset.id, settings.supportGemIds]);
  const selected = useMemo(() => new Set(normalizeSkillSupportIds(preset.id, settings.supportGemIds)), [preset.id, settings.supportGemIds]);
  const changes = useMemo(() => skillSupportPriorityChanges(settings, preset), [settings, preset]);
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const visibleSupports = supports.filter(support => (!selectedOnly || selected.has(support.id))
    && terms.every(term => support.name.toLowerCase().includes(term)));
  if (supports.length === 0) return null;
  return <fieldset className="skill-supports" aria-label="Reviewed supports">
    <legend>
      <span className="label-with-info"><span>Reviewed supports</span>
      <InfoTooltip id="reviewed-supports-tooltip" label="About reviewed supports">
        <p>A reviewed list for this skill's stated focus, not every legal support or a recommended gem loadout. Select only supports you use. One tier per family is retained.</p>
        <p>Search support names or show selected supports only. Filters do not remove hidden selections or change their warnings and priority suggestions.</p>
        <p>Selection updates suggestions and warnings, not your current weights. Add suggestions preserves weights; Apply support priorities changes only the listed support-specific effects. Removing a support does not undo your preferences.</p>
        <p>Equipment, support sockets, attributes, other linked gems, conversions and Full DPS are not validated. Unlisted supports are not modeled.</p>
      </InfoTooltip>
      </span>
    </legend>
    <div className="support-picker-filters">
      <ControlTooltip id="support-search-tooltip" block text="Filter support names for this skill. All words must match, in any order; capitalization does not matter. Press Escape to clear the search. Hidden selections remain active.">
        <input className="support-picker-search" type="search" disabled={disabled} aria-label="Search reviewed supports" aria-describedby="support-search-tooltip"
          placeholder="Search supports" value={query} autoComplete="off" spellCheck={false}
          onChange={event => setQuery(event.currentTarget.value)}
          onKeyDown={event => {
            if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setQuery(""); }
          }} />
      </ControlTooltip>
      <div className="support-picker-filter-row">
        <ControlTooltip id="selected-supports-tooltip" text="Show only selected supports for this skill. Search still applies. Turning this filter on or off does not change selections or weights.">
          <label className="support-picker-selected">
            <input type="checkbox" disabled={disabled} aria-label="Selected supports only" aria-describedby="selected-supports-tooltip"
              checked={selectedOnly} onChange={event => setSelectedOnly(event.currentTarget.checked)} />
            <span>Selected only</span>
          </label>
        </ControlTooltip>
        <span className="support-picker-count" role="status" aria-live="polite" aria-atomic="true"
          aria-label={`${visibleSupports.length} of ${supports.length} supports shown; ${selected.size} selected`}>
          {visibleSupports.length}/{supports.length} shown, {selected.size} selected
        </span>
      </div>
    </div>
    <ul className="reviewed-support-list" aria-label={`${preset.name} reviewed supports`}>
      {visibleSupports.map((support) => <li key={support.id}>
        <label>
          <input type="checkbox" disabled={disabled} checked={selected.has(support.id)} aria-label={`Use ${support.name}`}
            aria-describedby={selected.has(support.id) ? `support-${support.id}-summary` : undefined}
            onChange={(event) => onChange(setSkillSupport(settings, support.id, event.currentTarget.checked))} />
          <span>{support.name}</span>
        </label>
        <SupportInfo id={support.id} name={support.name} summary={support.summary} sourceUrl={support.sourceUrl} selected={selected.has(support.id)} />
      </li>)}
    </ul>
    {visibleSupports.length === 0 ? <div className="support-picker-empty">
      <p>{selectedOnly ? selected.size === 0 ? "No supports selected." : "No selected supports match." : "No matching supports."}</p>
      <button className="tool-button" disabled={disabled} type="button" onClick={() => { setQuery(""); setSelectedOnly(false); }}>Clear filters</button>
    </div> : null}
    {changes.length > 0 ? <div className="support-priority-changes">
      <ul aria-label="Support priority changes">
        {changes.map((entry) => <li key={entry.id}>{`${passivePreferenceCatalog.find((effect) => effect.id === entry.id)!.label}: ${priorityName(settings.preferences.find((current) => current.id === entry.id)?.weight)} -> ${priorityName(entry.weight)}`}</li>)}
      </ul>
      <ControlTooltip id="apply-support-priorities-tooltip" text="Apply only the priority changes listed above, including updating an existing weight or adding a missing effect. All other preferences, required goals, allocated nodes and point budgets stay unchanged.">
        <button className="tool-button" type="button" disabled={disabled} aria-describedby="apply-support-priorities-tooltip"
          onClick={() => onChange(applySkillSupportPriorities(settings, preset))}>Apply support priorities</button>
      </ControlTooltip>
    </div> : null}
  </fieldset>;
}

const SupportInfo = memo(function SupportInfo({ id, name, summary, sourceUrl, selected }: {
  id: string; name: string; summary: string; sourceUrl: string; selected: boolean;
}) {
  return <InfoTooltip id={`support-${id}-${selected ? "summary" : "help"}`} label={`About ${name}`} deferContent={!selected}>
    <p>{summary}</p>
    <a href={sourceUrl} target="_blank" rel="noreferrer" aria-label={`${name} data reference`}>Support data reference</a>
  </InfoTooltip>;
});

function priorityName(weight: number | undefined): string {
  return weight === 3 ? "Highest" : weight === 2 ? "High" : weight === 1 ? "Normal" : "Not selected";
}
