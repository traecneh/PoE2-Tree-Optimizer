import { passivePreferenceCatalog, type PassiveOptimizationSettings } from "../tree/passivePreferences";
import { addSkillPresetPreferences, getSkillPreferencePreset, resolveSkillPreferencePreset } from "../tree/skillPreferencePresets";
import { isSocketedProxyFocus, proxySocketedSkillIds } from "../tree/proxySkillPreferencePresets";
import { isUtilityTriggerFocus } from "../tree/utilityTriggerSkillPreferencePresets";
import { mortarCannonGrenades } from "../tree/mortarCannonPreferences";
import { ControlTooltip, InfoTooltip } from "./ControlTooltip";
import { refineSkillPreferencePreset } from "../tree/skillSupportPreferences";
import { SkillSupportControls } from "./SkillSupportControls";
import { SkillFocusPicker } from "./SkillFocusPicker";

type Props = {
  settings: PassiveOptimizationSettings;
  onChange: (settings: PassiveOptimizationSettings) => void;
  disabled: boolean;
};

export function SkillPreferencePresetControls({ settings, onChange, disabled }: Props) {
  const basePreset = resolveSkillPreferencePreset(settings);
  const preset = basePreset ? refineSkillPreferencePreset(basePreset, settings.supportGemIds) : undefined;
  const activeIds = new Set(settings.preferences.map((preference) => preference.id));
  const missingSuggestions = preset?.suggestions.filter((suggestion) => !activeIds.has(suggestion.id)) ?? [];
  const exclusions = preset?.exclusions.filter((exclusion) => activeIds.has(exclusion.id)) ?? [];

  return (
    <section className="skill-preference-presets" aria-label="Skill-informed preferences">
      <SkillFocusPicker value={preset?.id ?? ""} disabled={disabled} onChange={id => {
        const next = { ...settings, focusSkillId: id || undefined, supportGemIds: undefined, socketedGrenadeId: undefined };
        delete next.socketedProxySkillId;
        onChange(next);
      }} help={<>
        {preset ? <>
          <p className="focus-skill-tags">{preset.tags.filter((tag) => !["intelligence", "strength", "dexterity", "grants_active_skill"].includes(tag)).map(displayTag).join(" / ")}</p>
          <p>{preset.description}</p>
          <a href={preset.sourceUrl} target="_blank" rel="noreferrer">Skill data reference</a>
        </> : null}
        <p>Reviewed presets suggest relevant passive effects, not every effect sharing a gem tag. Priorities are heuristics, not Full DPS.</p>
        <p>Changing skill clears its supports and socketed skill, not goals, manual priorities or point budget. Add suggestions explicitly.</p>
        <p>Only reviewed wording and matching weapon/component scopes are scored. Conversion, trigger frequency and conditional uptime are not simulated.</p>
      </>} />
      {preset?.id === "mortar-cannon" ? <ControlTooltip id="socketed-grenade-tooltip" block text={<>
        <strong>Socketed Grenade</strong>
        <p>The selected Grenade supplies Mortar Cannon's Totem-used hit component. No Grenade is assumed by default. Player-only debuff scopes and unreviewed supports do not transfer automatically.</p>
        <p>Changing this selection preserves goals, point budgets and manual effect priorities. Add suggestions explicitly; remove any old preferences you no longer want.</p>
        <p>Native penalties to damage and attack speed, improved Grenade cooldown recovery, fuses, clouds, ground effects and external detonations are not a Full DPS simulation.</p>
      </>}>
        <div className="focus-skill-picker">
          <label htmlFor="socketed-grenade">Socketed Grenade</label>
          <select id="socketed-grenade" value={settings.socketedGrenadeId ?? ""} disabled={disabled} required aria-describedby="socketed-grenade-tooltip"
            onChange={(event) => onChange({ ...settings, socketedGrenadeId: event.currentTarget.value || undefined })}>
            <option value="">Select a Grenade</option>
            {mortarCannonGrenades.map((grenade) => <option key={grenade.id} value={grenade.id}>{grenade.name}</option>)}
          </select>
        </div>
      </ControlTooltip> : null}
      {preset && isSocketedProxyFocus(preset.id) ? <ControlTooltip id="socketed-proxy-tooltip" block text={<>
        <strong>Socketed skill</strong>
        <p>{isUtilityTriggerFocus(settings.focusSkillId ?? "")
          ? settings.focusSkillId === "blasphemy"
            ? "Choose a reviewed curse for its continuous aura. Curse magnitude and coverage are separate from self-cast speed, duration, activation delay and per-curse Spirit reservation."
            : settings.focusSkillId === "feral-invocation"
              ? "Choose a reviewed single animal attack for a visage, not a Minion or Totem. Mana actually spent supplies Energy; each visage acts once."
              : "Choose a reviewed triggered player spell. Self-cast speed is not trigger frequency. Energy generation requires actual events; no maximum Energy, permanent uptime or sustained DPS is assumed."
          : settings.focusSkillId === "mirage-archer"
          ? "Choose one of the four reviewed Bow attacks; nothing is selected by default. Dodge rolling creates a Mirage, not a Minion or Totem. Lifetime, spawn cooldown and firing stay separate; the Mirage cannot consume Power, Frenzy or Endurance Charges."
          : "Choose a reviewed Mace attack or spell for this Totem. Nothing is assumed by default. Totems are not Minions; deployment, firing and charge supply stay separate."}</p>
        <p>Common supports refer to the reviewed parent or granted component, not every support of the original self-used skill. Charge mixture, continuous uptime and Full DPS are not calculated.</p>
        <p>Changing this choice preserves goals, budget and manual priorities. Add suggestions explicitly, then remove old preferences you no longer want.</p>
      </>}>
        <div className="focus-skill-picker">
          <label htmlFor="socketed-proxy-skill">Socketed skill</label>
          <select id="socketed-proxy-skill" value={settings.socketedProxySkillId ?? ""} disabled={disabled} required aria-describedby="socketed-proxy-tooltip"
            onChange={event => onChange({ ...settings, socketedProxySkillId: event.currentTarget.value || undefined })}>
            <option value="">Select a skill</option>
            {proxySocketedSkillIds(preset.id).map(id => <option key={id} value={id}>{getSkillPreferencePreset(id)!.name}</option>)}
          </select>
        </div>
      </ControlTooltip> : null}
      {preset ? <>
        <SkillSupportControls preset={basePreset!} settings={settings} onChange={onChange} disabled={disabled} />
        <div className="skill-suggestions-heading">
          <h3>Suggested effects</h3>
          <ControlTooltip id="add-skill-suggestions-tooltip" text="Add missing suggested effects. Existing preference priorities are not overwritten.">
            <button className="tool-button" type="button" disabled={disabled || missingSuggestions.length === 0}
              aria-describedby="add-skill-suggestions-tooltip" onClick={() => onChange(addSkillPresetPreferences(settings, basePreset!))}>Add suggestions</button>
          </ControlTooltip>
        </div>
        <ul className="skill-suggestions" aria-label={`${preset.name} suggested effects`}>
          {preset.suggestions.map((suggestion) => {
            const effect = passivePreferenceCatalog.find((effect) => effect.id === suggestion.id)!;
            return <li key={suggestion.id}>
              <label>
                <input type="checkbox" checked={activeIds.has(suggestion.id)} disabled={disabled}
                  aria-label={`Use ${effect.label} for ${preset.name}`}
                  aria-describedby={`skill-suggestion-${suggestion.id}-reason`}
                  onChange={(event) => onChange({ ...settings, preferences: event.currentTarget.checked
                    ? [...settings.preferences, { id: suggestion.id, weight: suggestion.weight }]
                    : settings.preferences.filter((preference) => preference.id !== suggestion.id) })} />
                <span className="skill-suggestion-effect">{effect.label}</span>
              </label>
              <InfoTooltip id={`skill-suggestion-${suggestion.id}-reason`} label={`About ${effect.label} for ${preset.name}`}>{suggestion.reason}</InfoTooltip>
            </li>;
          })}
        </ul>
        {exclusions.length > 0 ? <div className="skill-preference-cautions" role="note" aria-label="Preferences outside this skill focus">
          <strong>Review selected effects</strong>
          {exclusions.map((exclusion) => {
            const label = passivePreferenceCatalog.find((effect) => effect.id === exclusion.id)!.label;
            return <div className="scope-caution-row" key={exclusion.id}><span>{label}</span>
              <InfoTooltip id={`skill-exclusion-${exclusion.id}`} label={`Why review ${label}?`}>{exclusion.reason}</InfoTooltip>
            </div>;
          })}
        </div> : null}
      </> : null}
    </section>
  );
}

function displayTag(tag: string): string {
  if (tag === "area") return "AoE";
  return tag.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
