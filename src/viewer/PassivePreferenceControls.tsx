import { passivePreferenceCatalog, type PassiveOptimizationSettings } from "../tree/passivePreferences";
import { ControlTooltip, InfoTooltip } from "./ControlTooltip";
import { maxPassiveAllocationPointCount } from "../tree/passivePointBudget";
import { SkillPreferencePresetControls } from "./SkillPreferencePresetControls";
import { resolveSkillPreferencePreset, reviewedWeaponPassiveScopes } from "../tree/skillPreferencePresets";
import { refineSkillPreferencePreset } from "../tree/skillSupportPreferences";
import { PassiveEffectPicker } from "./PassiveEffectPicker";

type Props = { settings: PassiveOptimizationSettings; onChange: (settings: PassiveOptimizationSettings) => void; disabled: boolean; mainPointLimit?: number };

export function PassivePreferenceControls({ settings, onChange, disabled, mainPointLimit = maxPassiveAllocationPointCount }: Props) {
  const basePreset = resolveSkillPreferencePreset(settings);
  const skillPreset = basePreset ? refineSkillPreferencePreset(basePreset, settings.supportGemIds) : undefined;
  return (
    <div className="passive-preferences">
      <ControlTooltip id="optimizer-mode-tooltip" block text={<>
        <strong>Route objective</strong>
        <p>Shortest keeps the existing fewest-points search.</p>
        <p>Build Focus favors selected skill, support and effect priorities within your point budget. Every build goal remains required.</p>
        <p>Preference scores are relative priorities, not Full DPS or total defence. Conditional effects, gear interactions and unselected effects are not valued. Review the route before applying.</p>
      </>}>
        <fieldset className="optimizer-mode" disabled={disabled} aria-describedby="optimizer-mode-tooltip">
          <legend>Route objective</legend>
          <label><input type="radio" name="route-objective" checked={settings.mode === "shortest"} onChange={() => onChange({ ...settings, mode: "shortest" })} />Shortest</label>
          <label><input type="radio" name="route-objective" checked={settings.mode === "weighted"} onChange={() => onChange({ ...settings, mode: "weighted" })} />Build Focus</label>
        </fieldset>
      </ControlTooltip>
      {settings.mode === "weighted" ? <>
        <SkillPreferencePresetControls settings={settings} onChange={onChange} disabled={disabled} />
        <ControlTooltip id="point-budget-mode-tooltip" block text={<>
          <strong>Point budget</strong>
          <p>Extra points limits detours relative to the shortest baseline found, capped by the remaining main-tree points.</p>
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
          <p>Maximum added nodes = shortest baseline found + this budget, capped by the remaining main-tree points. Existing main allocations and the larger weapon set count toward the total limit.</p>
          <p>Zero allows alternative routes at the baseline cost. Large goal sets use a shortest baseline found, not a proven minimum. Fixed weapon branches and their main-tree attachments are preserved, not optimized.</p>
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
        <PassiveEffectPicker preferences={settings.preferences} disabled={disabled} onToggle={(id, selected) => {
          if (selected && !settings.preferences.some(preference => preference.id === id)) onChange({ ...settings, preferences: [...settings.preferences, { id, weight: 1 }] });
          else if (!selected) onChange({ ...settings, preferences: settings.preferences.filter(preference => preference.id !== id) });
        }} />
        <ul className="passive-preference-list" aria-label="Selected passive preferences">
          {settings.preferences.map((preference) => {
            const effect = passivePreferenceCatalog.find((effect) => effect.id === preference.id)!;
            const explanation = "description" in effect ? `${effect.description} ` : "";
            const skillReason = skillPreset?.suggestions.find((suggestion) => suggestion.id === effect.id)?.reason;
            let scopeReason = effect.id === "projectileSpeed"
              ? skillPreset?.passiveStatScopes?.includes("spellProjectileSpeed")
                ? `For ${skillPreset.name}, includes Projectile Speed for Spell Skills (increased and reduced). `
                : "Spell-only projectile speed is ignored without a reviewed spell-projectile focus. "
              : "";
            if (effect.id === "criticalChance") {
              scopeReason = skillPreset?.passiveStatScopes?.includes("spellCriticalChance")
                ? `For ${skillPreset.name}, spell-only critical chance counts, including reductions. `
                : skillPreset?.passiveStatScopes?.includes("attackCriticalChance")
                  ? `For ${skillPreset.name}, attack-only critical chance counts, including reductions. `
                  : basePreset?.passiveStatScopes?.includes("spellCriticalChance")
                    ? "Controlled Destruction blocks spell-only crit here. Generic manual crit still counts. "
                    : "Spell/attack-only crit requires a reviewed matching hit-focused skill. ";
              const weapon = reviewedWeaponPassiveScopes.find((entry) => entry.criticalChance && skillPreset?.passiveStatScopes?.includes(entry.criticalChance));
              if (weapon) scopeReason += `Also includes Critical Hit Chance with ${weapon.label} once, including reductions. Scores only while this preference is selected. `;
              if (skillPreset?.passiveStatScopes?.includes("oneHandedMeleeCriticalChance")) scopeReason += "Also includes Critical Hit Chance with One Handed Melee Weapons once. Spear projectile hits qualify by weapon classification, not melee damage. Requires nonzero base critical chance and being able to crit; gear and prohibitions are not simulated. ";
            }
            if (effect.id === "areaOfEffect") {
              const areaDamageHelp = skillPreset?.passiveStatScopes?.includes("spellAreaDamage")
                ? "Select Spell Area Damage separately to score Roil/Ruin's damage tradeoffs. "
                : "Spell Area Damage is not modeled for this focus. ";
              scopeReason = skillPreset?.passiveStatScopes?.includes("spellAreaOfEffect")
                ? `For ${skillPreset.name}, includes Spell Skills have increased/reduced Area of Effect once, as ${skillPreset.id === "fireball" ? "explosion coverage" : "reviewed area-component coverage"}, not hit damage. ${areaDamageHelp}Echoed/conditional effects are ignored. `
                : skillPreset?.passiveStatScopes?.includes("attackAreaOfEffect")
                  ? `For ${skillPreset.name}, attack-only Area of Effect counts as coverage, not hit damage. Spell-only Area of Effect is ignored. `
                  : "Attack-only Area of Effect is ignored for this focus. Spell-only Area of Effect requires a reviewed area-spell focus. ";
              if (skillPreset?.passiveStatScopes?.includes("grenadeAreaOfEffect")) scopeReason += "Grenade Area of Effect also adds here once, including reductions. Coverage is not guaranteed overlap or extra damage. ";
            }
            if (effect.id === "cooldownRecoveryRate" && skillPreset?.passiveStatScopes?.includes("grenadeCooldownRecovery")) {
              scopeReason += "Includes Cooldown Recovery Rate for Grenade Skills once, including reductions. This replenishes stored uses, not fuse speed, reload speed or Skill Effect Duration. ";
            }
            if (effect.id === "areaDamage") {
              scopeReason = skillPreset?.passiveStatScopes?.some((scope) => scope === "spellAreaDamage" || scope === "attackAreaDamage")
                ? `For ${skillPreset.name}, generic Area Damage counts once on reviewed damaging area components only. Non-area projectiles, coverage-only components and minion damage are excluded. Select Attack/Spell Area Damage separately for those distinct stat lines, not to count this line again. `
                : "Ignored without a reviewed damaging area-component focus, including in manual mode. Coverage-only curses, Contagion spread and targeting areas do not qualify. ";
              if (skillPreset && ["fireball", "frostbolt", "bonestorm"].includes(skillPreset.id)) scopeReason += "The explosion only, not the travelling projectile or secondary non-area hits. ";
              if (skillPreset?.id === "tempest-flurry") scopeReason += "Normal Strikes only, not Third or Fourth Strike. ";
              if (skillPreset?.id === "explosive-spear") scopeReason += "Explosion and Frenzy-Charged hits only, not the travelling spear or ground effects. ";
            }
            if (effect.id === "spellAreaDamage") {
              scopeReason = skillPreset?.passiveStatScopes?.includes("spellAreaDamage")
                ? "Ruin's +35% damage and Roil's -10% damage count once here. Their area changes count only under Area of Effect. Unselected damage has no score. "
                : "Ignored without a reviewed spell-area damage focus. Does not add to Spell Damage or Area of Effect. ";
            }
            if (effect.id === "attackAreaDamage") {
              scopeReason = skillPreset?.passiveStatScopes?.includes("attackAreaDamage")
                ? `For ${skillPreset.name}, scores attack-area damage once, including reductions. ${skillPreset.id === "tempest-flurry" ? "Normal Strikes only, not Third or Fourth Strike. " : skillPreset.id === "explosive-spear" ? "Explosion and Frenzy-Charged hits only, not the travelling spear or ground effects. " : "Reviewed area hits only. "}Select Area of Effect separately for coverage. `
                : "Ignored without a reviewed attack-area damage focus. An Area tag or targeting radius alone does not qualify. ";
            }
            if (effect.id === "elementalDamage") {
              scopeReason = skillPreset?.passiveStatScopes?.includes("attackElementalDamage")
                ? `For ${skillPreset.name}, Elemental Damage with Attacks adds here once, including reductions, not to Attack Damage or each element. Only its elemental portion benefits; conversion amounts and actual DPS are not calculated. `
                : "Attack-only elemental damage is ignored without a reviewed native-elemental attack focus. Gear-added elements and conversions are not inferred for physical-only focuses. Generic manual Elemental Damage still counts. ";
            }
            if (effect.id === "stunBuildup") {
              scopeReason = skillPreset?.passiveStatScopes?.includes("meleeStunBuildup")
                ? `For ${skillPreset.name}, Stun Buildup with Melee Damage adds here once, including reductions, for reviewed stun-capable melee hits. `
                : "Melee/weapon-only Stun Buildup is ignored without a reviewed matching focus. Generic manual Stun Buildup still counts. ";
              const weapon = reviewedWeaponPassiveScopes.find((entry) => entry.stunBuildup && skillPreset?.passiveStatScopes?.includes(entry.stunBuildup));
              if (weapon) scopeReason += `Also includes Stun Buildup with ${weapon.label} once. Distinct generic, melee and matching weapon sources add, not multiply. `;
              if (skillPreset?.id === "boneshatter") scopeReason += "Shockwave only, not the initial strike. Requires an enemy Primed for Stun; this does not prime enemies or predict shockwave frequency. ";
              if (skillPreset?.id === "rolling-slam") scopeReason += "Damaging slams only, not the non-damaging sequence wrapper. ";
            }
            if (effect.id === "freezeBuildup") {
              const weapon = reviewedWeaponPassiveScopes.find((entry) => entry.freezeBuildup && skillPreset?.passiveStatScopes?.includes(entry.freezeBuildup));
              scopeReason = weapon
                ? `For ${skillPreset!.name}, Freeze Buildup with ${weapon.label} adds here once, including reductions, on its reviewed native-cold hits. Generic and matching weapon sources add once. Requires being able to inflict Freeze; this grants neither cold damage nor freeze chance. `
                : "Quarterstaff-only Freeze Buildup is ignored without a reviewed native-cold quarterstaff focus. Tempest Flurry's lightning conversion does not qualify. Gear-added cold is not inferred; generic manual Freeze Buildup still counts. ";
            }
            if (effect.id === "accuracy") {
              const weapon = reviewedWeaponPassiveScopes.find((entry) => entry.accuracy && skillPreset?.passiveStatScopes?.includes(entry.accuracy));
              scopeReason = weapon
                ? `For ${skillPreset!.name}, Accuracy Rating with ${weapon.label} adds here once, including reductions, only for matching weapon attacks that use accuracy. Generic and matching weapon sources add; other weapon bonuses are ignored. This is not final hit chance or a benefit for cannot-miss components. `
                : "Weapon-only Accuracy Rating is ignored without a reviewed matching bow, spear or quarterstaff attack focus. Generic manual Accuracy Rating still counts. ";
              scopeReason += skillPreset?.passiveStatScopes?.includes("twoHandedMeleeAccuracy")
                ? "Also includes Accuracy Rating with Two Handed Melee Weapons once, including reductions. Generic, matching weapon and handedness sources add, not multiply. "
                : skillPreset?.passiveStatScopes?.includes("oneHandedMeleeAccuracy")
                  ? "Also includes Accuracy Rating with One Handed Melee Weapons once, including reductions. Spear projectile hits qualify by weapon classification, not melee damage. Generic, spear and handedness sources add once. "
                  : "Two Handed Melee Weapons accuracy does not apply to bows; one/two-handed mace equipment is not inferred. ";
            }
            if (effect.id === "criticalDamageBonus") {
              scopeReason = skillPreset?.passiveStatScopes?.includes("spellCriticalDamageBonus")
                ? `For ${skillPreset.name}, Critical Spell Damage Bonus adds here once, including reductions, only for reviewed spell-hit components, not DoT or minion hits. `
                : skillPreset?.passiveStatScopes?.includes("attackCriticalDamageBonus")
                  ? `For ${skillPreset.name}, Critical Damage Bonus for Attack Damage adds here once, including reductions, only for reviewed attack-hit components, not spells, DoT or minion hits. Requires a weapon/skill capable of critical hits; this does not grant critical chance. `
                : basePreset?.passiveStatScopes?.includes("spellCriticalDamageBonus")
                  ? "Controlled Destruction blocks Critical Spell Damage Bonus here. Generic manual critical damage bonus still counts. "
                  : "Critical Spell Damage Bonus and attack-only critical damage bonus are ignored without a reviewed matching critical-hit focus. ";
              const weapon = reviewedWeaponPassiveScopes.find((entry) => entry.criticalDamageBonus && skillPreset?.passiveStatScopes?.includes(entry.criticalDamageBonus));
              if (weapon) scopeReason += `Also includes Critical Damage Bonus with ${weapon.label} once, including reductions. Distinct generic, attack-only and matching weapon sources add here, not under Critical Hit Chance. Other weapon bonuses are ignored. `;
              if (skillPreset?.passiveStatScopes?.includes("oneHandedMeleeCriticalDamageBonus")) scopeReason += "Also includes Critical Damage Bonus with One Handed Melee Weapons once. Distinct generic, attack-only, spear and handedness sources add, not multiply. Requires damaging critical hits that can deal extra critical damage; this increases the bonus, not the whole critical multiplier. Prohibitions are not simulated. ";
            }
            if (effect.id === "ailmentChance") {
              scopeReason = skillPreset?.passiveStatScopes?.includes("oneHandedAttackAilmentChance")
                ? `For ${skillPreset.name}, one-handed attack ailment chance adds here once, including reductions, not to flat Poison/Bleeding/Daze chance. Requires eligible hits and being able to inflict the ailment. Increased chance alone grants no Poison or Bleeding chance; elemental chance can depend on hit damage. Base chances, damage, caps and prohibitions are not simulated. `
                : "One-handed attack ailment chance is ignored without a reviewed matching spear focus; mace handedness is not inferred. Generic manual ailment chance still counts. ";
            }
            if (effect.id === "blindChance") {
              scopeReason = skillPreset?.passiveStatScopes?.includes("attackBlindChance")
                ? `For ${skillPreset.name}, attack-hit Blind chance adds to generic Blind chance once, not under ailment chance. Actual hit components only, not non-damaging sequence wrappers. `
                : "Attack-only Blind chance requires a reviewed player attack-hit focus. Generic manual Blind chance still counts for other player hits, not minion/proxy hits. ";
            }
            if (effect.id === "hinderChance") {
              scopeReason = skillPreset?.passiveStatScopes?.includes("spellHinderChance")
                ? `For ${skillPreset.name}, spell-hit Hinder chance counts once on reviewed hit components, not damage over time or minion/proxy hits. `
                : "Ignored without a reviewed player spell-hit focus. Casting a curse, Offering or Totem does not itself supply a player hit. ";
              if (skillPreset?.id === "essence-drain") scopeReason += "Initial projectile hit only, not the DoT debuff. ";
              if (skillPreset?.id === "detonate-dead") scopeReason += "The corpse explosion is a spell-skill hit for application; this does not enable Spell Damage scaling for its secondary damage. ";
              if (skillPreset?.id === "unearth") scopeReason += "Player spike hits only, not hits from summoned constructs. A minion-summoning tag is not hit ownership. ";
            }
            if (effect.id === "maimChance" || effect.id === "incisionChance") {
              const scope = effect.id === "maimChance" ? "attackMaimChance" : "attackIncisionChance";
              scopeReason = skillPreset?.passiveStatScopes?.includes(scope)
                ? `For ${skillPreset.name}, counts once on reviewed player attack-hit components only, not non-damaging sequence wrappers or minion/proxy hits. No existing debuff state is assumed. `
                : "Ignored without a reviewed player attack-hit focus, including manual mode. A spell hit, minion attack or attack gem tag alone does not qualify. ";
            }
            if (effect.id === "attackDamage" || effect.id === "attackSpeed") {
              const damage = effect.id === "attackDamage";
              const weapon = reviewedWeaponPassiveScopes.find((entry) => skillPreset?.passiveStatScopes?.includes(damage ? entry.damage : entry.speed));
              scopeReason = weapon
                ? `For ${skillPreset!.name}, ${damage ? "Damage" : "Attack Speed"} with ${weapon.label} adds to ${effect.label} once, including reductions. Other weapon bonuses are ignored. `
                : "Weapon-only damage and attack speed require a reviewed matching attack focus. ";
              if (damage && skillPreset?.passiveStatScopes?.includes("grenadeDamage")) scopeReason += "Grenade Damage adds here once, including Utility Ordnance's damage penalty. Fuse duration and additional detonations are not modeled. ";
              if (weapon?.wording === "crossbows" && !damage) scopeReason += "Attack Speed is firing/launch speed, not Crossbow Reload Speed, Grenade cooldown or detonation time. ";
              if (damage && skillPreset?.passiveStatScopes?.includes("meleeDamage")) {
                scopeReason += "Unconditional Melee Damage also adds to Attack Damage once. ";
              }
              if (damage) scopeReason += skillPreset?.passiveStatScopes?.includes("twoHandedWeaponDamage")
                ? "Damage with Two Handed Weapons also adds to Attack Damage once, including reductions. Distinct generic, matching weapon and two-handed sources add; this line does not also score as Projectile, Spell or elemental damage. "
                : skillPreset?.passiveStatScopes?.includes("oneHandedWeaponDamage")
                  ? "Damage with One Handed Weapons also adds to Attack Damage once, including reductions. Distinct generic, spear and one-handed sources add; this line does not also score as Projectile, Spell or elemental damage. "
                  : "Two Handed Weapons damage requires a reviewed two-handed hit focus; mace equipment is not inferred. ";
              if (!damage && skillPreset?.passiveStatScopes?.includes("oneHandedWeaponAttackSpeed")) scopeReason += "One-handed weapon Attack Speed and one-handed melee-weapon Attack Speed add here once, including reductions. Distinct generic, spear and handedness sources add, not multiply; neither line scores as Cast Speed or Skill Speed. ";
            }
            return <li key={preference.id}>
              <span className="label-with-info preference-label">
                <span className="passive-preference-name">{effect.label}</span>
                <InfoTooltip id={`preference-${effect.id}-tooltip`} label={`About ${effect.label} priority`}>
                  {`${explanation}${skillReason ? `${skillReason} ` : ""}${scopeReason}Normal: 1 score per ${effect.unit}. High: x2. Highest: x3. Unconditional effects only.`}
                </InfoTooltip>
              </span>
              <select aria-label={`${effect.label} priority`} value={preference.weight} disabled={disabled}
                onChange={(event) => onChange({ ...settings, preferences: settings.preferences.map((current) => current.id === effect.id ? { ...current, weight: Number(event.currentTarget.value) } : current) })}>
                <option value={1}>Normal</option><option value={2}>High</option><option value={3}>Highest</option>
              </select>
              <button className="tool-button" type="button" aria-label={`Remove ${effect.label} preference`} disabled={disabled}
                onClick={() => onChange({ ...settings, preferences: settings.preferences.filter((current) => current.id !== effect.id) })}>Remove</button>
            </li>;
          })}
        </ul>
      </> : null}
    </div>
  );
}
