import { selectPickerOption } from "../testUtils/selectPickerOption";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { passivePreferenceCatalog, type PassiveOptimizationSettings } from "../tree/passivePreferences";
import { PassivePreferenceControls } from "./PassivePreferenceControls";

describe("PassivePreferenceControls point budget", () => {
  it("labels the weighted objective Build Focus without changing its saved mode or existing settings", () => {
    const current: PassiveOptimizationSettings = { ...weightedSettings(), mode: "shortest", focusSkillId: "spark" };
    const onChange = vi.fn();
    render(<PassivePreferenceControls settings={current} onChange={onChange} disabled={false} />);
    expect(screen.getByRole("radio", { name: "Shortest" })).toHaveProperty("checked", true);
    expect(screen.queryByRole("radio", { name: "Passive preferences" })).toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "Build Focus" }));
    expect(onChange).toHaveBeenCalledWith({ ...current, mode: "weighted" });
  });

  it("explains Grenade damage penalties and keeps recharge separate from fuse and reload timing", () => {
    render(<PassivePreferenceControls settings={{ ...weightedSettings(), focusSkillId: "explosive-grenade", preferences: [
      { id: "attackDamage", weight: 3 }, { id: "attackSpeed", weight: 1 }, { id: "areaOfEffect", weight: 1 }, { id: "cooldownRecoveryRate", weight: 2 },
    ] }} onChange={vi.fn()} disabled={false} />);
    expect(document.getElementById("preference-attackDamage-tooltip")?.textContent).toContain("Utility Ordnance's damage penalty");
    expect(document.getElementById("preference-attackSpeed-tooltip")?.textContent).toContain("not Crossbow Reload Speed");
    expect(document.getElementById("preference-areaOfEffect-tooltip")?.textContent).toContain("Grenade Area of Effect also adds here once");
    expect(document.getElementById("preference-cooldownRecoveryRate-tooltip")?.textContent).toContain("not fuse speed, reload speed or Skill Effect Duration");
  });

  it.each(["contagion", "despair", "vulnerability", "detonate-dead"])("does not recommend unmodeled spell-area damage for %s coverage", (focusSkillId) => {
    const onChange = vi.fn();
    render(<PassivePreferenceControls settings={{ ...weightedSettings(), focusSkillId,
      preferences: [{ id: "areaOfEffect", weight: 1 }, { id: "spellAreaDamage", weight: 2 }] }} onChange={onChange} disabled={false} />);
    expect(document.getElementById("preference-areaOfEffect-tooltip")?.textContent).toContain("Spell Area Damage is not modeled for this focus");
    expect(document.getElementById("preference-areaOfEffect-tooltip")?.textContent).not.toContain("Select Spell Area Damage separately");
    expect(document.getElementById("preference-spellAreaDamage-tooltip")?.textContent).toContain("Ignored without a reviewed spell-area damage focus");
    expect(onChange).not.toHaveBeenCalled();
  });
  it.each(["ball-lightning", "frostbolt", "ice-nova", "comet", "firestorm", "frost-bomb", "flameblast", "frost-wall"])
    ("explains the reviewed %s area component without presenting it as Fireball-only coverage", (focusSkillId) => {
      const settings: PassiveOptimizationSettings = { ...weightedSettings(), focusSkillId,
        preferences: [{ id: "areaOfEffect", weight: 3 }, { id: "spellAreaDamage", weight: 2 }] };
      const onChange = vi.fn();
      render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);
      expect(document.getElementById("preference-areaOfEffect-tooltip")?.textContent).toContain("reviewed area-component coverage, not hit damage");
      expect(document.getElementById("preference-spellAreaDamage-tooltip")?.textContent).toContain("Ruin's +35% damage and Roil's -10% damage count once here");
      expect(document.getElementById("preference-spellAreaDamage-tooltip")?.textContent).not.toContain("currently Fireball only");
      expect(onChange).not.toHaveBeenCalled();
    });
  it.each([
    "firePenetration", "coldPenetration", "lightningPenetration", "elementalPenetration",
    "flammabilityMagnitude", "igniteMagnitude", "shockMagnitude", "poisonMagnitude", "bleedingMagnitude", "shockChance",
    "igniteDuration", "poisonDuration", "bleedingDuration", "shockDuration", "freezeDuration",
  ] as const)("offers opt-in %s through the existing picker, help, priority and remove controls", (id) => {
    const effect = passivePreferenceCatalog.find((p) => p.id === id)!;
    const settings: PassiveOptimizationSettings = { ...weightedSettings(), preferences: [] };
    const onChange = vi.fn<(settings: PassiveOptimizationSettings) => void>();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);
    expect(screen.queryByRole("combobox", { name: `${effect.label} priority` })).toBeNull();
    selectPickerOption(screen.getByRole("combobox", { name: "Add effect preference" }), id);
    const selected = onChange.mock.calls[0][0];
    expect(selected.preferences).toEqual([{ id, weight: 1 }]);
    rerender(<PassivePreferenceControls settings={selected} onChange={onChange} disabled={false} />);
    const tip = document.getElementById(`preference-${id}-tooltip`)?.textContent;
    expect(tip).toContain(`Normal: 1 score per ${effect.unit}`);
    expect(tip).toContain("Unconditional effects only");
    expect(effect).toHaveProperty("description");
    if ("description" in effect) expect(tip).toContain(effect.description);
    fireEvent.change(screen.getByRole("combobox", { name: `${effect.label} priority` }), { target: { value: "3" } });
    expect(onChange.mock.calls[1][0].preferences).toEqual([{ id, weight: 3 }]);
    fireEvent.click(screen.getByRole("button", { name: `Remove ${effect.label} preference` }));
    expect(onChange.mock.calls[2][0].preferences).toEqual([]);
  });
  it.each([
    ["energyShieldRechargeStart", "ES Recharge Start", "not a linear percentage reduction in delay seconds", "10% faster start of Energy Shield Recharge"],
    ["energyShieldRechargeRate", "ES Recharge Rate", "separate from start delay and maximum ES", "10% increased Energy Shield Recharge Rate"],
    ["lifeRegenerationRate", "Life Regeneration Rate", "does not grant flat Life per second or maximum Life", "10% increased Life Regeneration Rate"],
    ["manaRegenerationRate", "Mana Regeneration Rate", "not flat recovery, maximum Mana, cost reduction or leech", "10% increased Mana Regeneration Rate"],
    ["elementalAilmentThreshold", "Elemental Ailment Threshold", "not outgoing buildup, resistance or ailment immunity", "10% increased Elemental Ailment Threshold"],
    ["cooldownRecoveryRate", "Cooldown Recovery Rate", "not a linear reduction in cooldown seconds or cast speed", "10% increased Cooldown Recovery Rate"],
    ["charmChargesGained", "Charm Charges Gained", "not flat charges per second", "10% increased Charm Charges gained"],
    ["charmChargeGeneration", "Charm Charges per Second", "not divided by 60 again", "0.1 Charm charges generated per second"],
    ["charmChargeCostReduction", "Charm Charge Cost Reduction", "not calculated", "10% reduced Charm Charges used"],
    ["charmEffectDuration", "Charm Effect Duration", "Does not activate a Charm", "10% increased Charm Effect Duration"],
    ["freezeThreshold", "Freeze Threshold", "has no player Freeze Threshold calculation", "10% increased Freeze Threshold"],
    ["igniteEffectReduction", "Ignite Magnitude Reduction", "not your outgoing Ignite damage", "10% reduced Magnitude of Ignite on you"],
    ["ailmentDurationReduction", "Incoming Ailment Duration", "not separately for each ailment", "10% reduced Duration of Ailments on You"],
    ["warcrySpeed", "Warcry Speed", "Generic Skill Speed is scored separately, never copied here", "10% increased Warcry Speed"],
    ["warcryCooldownRecoveryRate", "Warcry Cooldown Recovery Rate", "not Warcry Speed", "10% increased Warcry Cooldown Recovery Rate"],
    ["warcryAreaOfEffect", "Warcry Area of Effect", "not radius percentage", "Warcry Skills have 10% increased Area of Effect"],
    ["lifeFlaskRecovery", "Life Flask Recovery", "not flask recovery rate, charges gained, regeneration or maximum Life", "10% increased Life Recovery from Flasks"],
    ["manaFlaskRecovery", "Mana Flask Recovery", "not flask recovery rate, charges gained, regeneration or maximum Mana", "10% increased Mana Recovery from Flasks"],
    ["lifeRecoup", "Life Recoup", "not mitigation, regeneration or instant recovery", "3% of Damage taken Recouped as Life"],
    ["manaRecoup", "Mana Recoup", "not regeneration, leech or instant recovery", "3% of Damage taken Recouped as Mana"],
    ["energyShieldRecoup", "Energy Shield Recoup", "not recharge or mitigation", "3% of Damage taken Recouped as Energy Shield"],
    ["flaskChargesGained", "Flask Charges Gained", "not flat generation, charges used or capacity", "10% increased Flask Charges gained"],
    ["lifeFlaskChargesGained", "Life Flask Charges Gained", "not flat generation or charges used", "10% increased Life Flask Charges gained"],
    ["manaFlaskChargesGained", "Mana Flask Charges Gained", "not flat generation or charges used", "10% increased Mana Flask Charges gained"],
    ["lifeFlaskChargeGeneration", "Life Flask Charges per Second", "not a percentage of charges gained or flask recovery", "0.1 Life Flask charges generated per second"],
    ["manaFlaskChargeGeneration", "Mana Flask Charges per Second", "not a percentage of charges gained or flask recovery", "0.1 Mana Flask charges generated per second"],
    ["accuracy", "Accuracy Rating", "not hit chance", "10% increased Accuracy Rating"],
    ["blockChance", "Block Chance", "not added percentage points or maximum Block Chance", "10% increased Block Chance"],
    ["stunThreshold", "Stun Threshold", "not Stun Buildup against enemies or Stun Recovery", "10% increased Stun Threshold"],
    ["stunRecovery", "Stun Recovery", "not Stun Threshold or outgoing Stun Buildup", "10% increased Stun Recovery"],
    ["presenceArea", "Presence Area of Effect", "not generic skill Area of Effect or radius percentage", "10% increased Presence Area of Effect"],
    ["skillMovementPenaltyReduction", "Skill Movement Penalty Reduction", "not as global Movement Speed", "10% reduced Movement Speed Penalty from using Skills while moving"],
    ["lifeLeechAmount", "Life Leech Amount", "not a source of Life leech or its speed", "10% increased amount of Life Leeched"],
    ["manaLeechAmount", "Mana Leech Amount", "not a source of Mana leech or its speed", "10% increased amount of Mana Leeched"],
    ["lifeLeechSpeed", "Life Leech Speed", "separate from amount leeched", "10% faster Life Leech"],
    ["flaskChargeCostReduction", "Flask Charge Cost Reduction", "increased cost negatively", "10% reduced Flask Charges used"],
    ["manaFlaskChargeCostReduction", "Mana Flask Charge Cost Reduction", "Generic costs have a separate preference", "10% reduced Flask Charges used from Mana Flasks"],
    ["criticalDamageBonus", "Critical Damage Bonus", "not Critical Hit Chance or flat added critical bonus", "10% increased Critical Damage Bonus"],
    ["stunBuildup", "Stun Buildup", "not your Stun Threshold, Stun Recovery or stun duration", "10% increased Stun Buildup"],
    ["freezeBuildup", "Freeze Buildup", "not Cold Damage, freeze duration or freeze chance", "10% increased Freeze Buildup"],
    ["minionCriticalChance", "Minion Critical Hit Chance", "not player critical chance or added percentage points", "15% increased minion Critical Hit Chance"],
    ["minionCriticalDamageBonus", "Minion Critical Damage Bonus", "not player critical bonus", "10% increased minion Critical Damage Bonus"],
    ["attackAreaDamage", "Attack Area Damage", "not Area of Effect coverage", "10% increased Attack Area Damage"],
    ["totemDamage", "Totem Damage", "not player self-use or minion damage", "10% increased Totem Damage"],
    ["totemLife", "Totem Life", "not player or minion maximum Life", "10% increased Totem Life"],
    ["totemPlacementSpeed", "Totem Placement Speed", "not its attacks or spell casting", "10% increased Totem Placement Speed"],
    ["totemDuration", "Totem Duration", "server-tick rounding, replacement limits", "10% increased Totem Duration"],
    ["totemAttackSpeed", "Totem Attack Speed", "not player or minion attack speed", "3% increased Attack Speed for attacks used by Totems"],
    ["totemCastSpeed", "Totem Cast Speed", "not player or minion cast speed", "3% increased Cast Speed for spells cast by Totems"],
    ["totemAreaOfEffect", "Totem Area of Effect", "Does not create an area for a single-target skill", "10% increased Area of Effect for Skills used by Totems"],
    ["totemPlacementRange", "Totem Placement Range", "not Totem firing/activation range", "10% increased Totem Placement range"],
    ["totemFireResistance", "Totem Fire Resistance", "not player/minion resistance", "+5% to Totem Fire Resistance"],
    ["totemColdResistance", "Totem Cold Resistance", "never Chaos", "+5% to Totem Cold Resistance"],
    ["totemLightningResistance", "Totem Lightning Resistance", "Overcapping, overrides and actual mitigation are not calculated", "+5% to Totem Lightning Resistance"],
    ["totemMaximumFireResistance", "Totem Maximum Fire Resistance", "Native default maximum is 75%, capped at 90%", "+1% to Totem Maximum Fire Resistance"],
    ["totemMaximumColdResistance", "Totem Maximum Cold Resistance", "enough ordinary resistance is required to benefit", "+1% to Totem Maximum Cold Resistance"],
    ["totemMaximumLightningResistance", "Totem Maximum Lightning Resistance", "Raw preference scores are not capped mitigation", "+1% to Totem Maximum Lightning Resistance"],
    ["totemPhysicalDamageReduction", "Totem Physical Damage Reduction", "not Armour, reduced damage taken or player/minion defence", "3% additional Totem Physical Damage Reduction"],
    ["totemLifeRegeneration", "Totem Life Regeneration", "not divided by 60 again", "1% of Totem maximum Life regenerated per second"],
    ["genericDamage", "Generic Damage", "rather than copied into each damage type or attack/spell preference", "10% increased Damage"],
    ["skillSpeed", "Skill Speed", "counted once here, not again as Attack Speed", "3% increased Skill Speed"],
    ["chillMagnitude", "Chill Magnitude", "Does not grant Chill application", "10% increased Magnitude of Chill you inflict"],
    ["poisonChance", "Poison Chance on Hit", "not increased ailment chance", "5 percentage points of chance to Poison on Hit"],
    ["bleedingChance", "Bleeding Chance on Hit", "not increased ailment chance", "5 percentage points of chance to inflict Bleeding on Hit"],
    ["dazeChance", "Daze Chance on Hit", "Final Daze probability", "5 percentage points of chance to Daze on Hit"],
    ["ailmentChance", "Generic Ailment Chance", "not flat added chance points", "10% increased chance to inflict Ailments"],
    ["electrocuteBuildup", "Electrocute Buildup", "Does not grant Electrocute application", "10% increased Electrocute Buildup"],
    ["ailmentMagnitude", "Ailment Magnitude", "counted once here, not again", "10% increased Magnitude of Ailments you inflict"],
    ["immobilisationBuildup", "Immobilisation Buildup", "not copied into Freeze, Electrocute, Pin or Stun", "10% increased Immobilisation buildup"],
    ["slowMagnitude", "Outgoing Slow Magnitude", "Reviewed native PoB cannot parse this wording", "Debuffs you inflict have 10% increased Slow Magnitude"],
    ["blindChance", "Blind Chance on Hit", "does not assume they are already Blinded", "5 percentage points of chance to Blind Enemies on Hit"],
    ["blindEffect", "Blind Effect", "not reduced; game wording supplies the reduction sign", "10% increased Blind Effect"],
    ["blindDuration", "Blind Duration", "Native PoB does not fully parse this wording", "10% increased Blind duration"],
    ["hinderChance", "Hinder Chance on Spell Hit", "Does not assume enemies are already Hindered", "5 percentage points of chance to Hinder Enemies on Hit with Spells"],
    ["hinderDuration", "Hinder Duration", "never copied into Slow Magnitude", "10% increased Hinder Duration"],
    ["knockbackDistance", "Knockback Distance", "Requires an applicable Knockback source; does not grant it", "10% increased Knockback Distance"],
    ["maimChance", "Maim Chance on Attack Hit", "Native PoB does not fully parse this wording", "5 percentage points of chance for Attacks to Maim on Hit"],
    ["incisionChance", "Incision Chance on Attack Hit", "discards its value", "5 percentage points of chance for Attack Hits to apply Incision"],
    ["markEffect", "Mark Effect", "LocalEffect, not MarkEffect", "10% increased Effect of your Mark Skills"],
    ["markUseSpeed", "Mark Use Speed", "Generic Skill Speed remains a separate source", "Mark Skills have 10% increased Use Speed"],
    ["markDuration", "Mark Duration", "Generic duration stays separate, never copied here", "Mark Skills have 10% increased Skill Effect Duration"],
    ["exposureEffect", "Exposure Effect", "Counted once here, not once per element", "10% increased Exposure Effect"],
    ["pinBuildup", "Pin Buildup", "Does not grant Pin application", "10% increased Pin Buildup"],
    ["dazeDuration", "Daze Duration", "Native PoB parsing is incomplete", "10% increased Daze Duration"],
    ["damagingAilmentMagnitude", "Damaging Ailment Magnitude", "not copied into Poison, Bleeding or Ignite preferences", "10% increased Magnitude of Damaging Ailments you inflict"],
    ["damagingAilmentDuration", "Damaging Ailment Duration", "not copied into Poison, Bleeding or Ignite duration preferences", "10% increased Duration of Damaging Ailments on Enemies"],
    ["slowPotencyReduction", "Slow Potency Reduction", "Native PoB parsing is unavailable", "10% reduced Slowing Potency of Debuffs on You"],
    ["curseEffectReduction", "Curse Effect Reduction", "Zero effect is not curse immunity", "10% reduced effect of Curses on you"],
    ["chillEffectReduction", "Chill Effect Reduction", "not outgoing Chill magnitude", "10% reduced Effect of Chill on you"],
    ["shockEffectReduction", "Shock Effect Reduction", "not outgoing Shock magnitude", "10% reduced effect of Shock on you"],
    ["fireResistance", "Fire Resistance", "never Chaos", "+5% to Fire Resistance"],
    ["coldResistance", "Cold Resistance", "never Chaos", "+5% to Cold Resistance"],
    ["lightningResistance", "Lightning Resistance", "never Chaos", "+5% to Lightning Resistance"],
    ["chaosResistance", "Chaos Resistance", "not increased resistance, penetration or maximum resistance", "+5% to Chaos Resistance"],
    ["maximumFireResistance", "Maximum Fire Resistance", "enough ordinary resistance is required", "+1% to Maximum Fire Resistance"],
    ["maximumColdResistance", "Maximum Cold Resistance", "enough ordinary resistance is required", "+1% to Maximum Cold Resistance"],
    ["maximumLightningResistance", "Maximum Lightning Resistance", "enough ordinary resistance is required", "+1% to Maximum Lightning Resistance"],
    ["armourBreakAmount", "Armour Break Amount", "Requires an Armour-breaking skill/effect", "Break 10% increased Armour"],
    ["fullyBrokenArmourEffect", "Fully Broken Armour Effect", "Requires the target's Armour to be Fully Broken", "10% increased effect of Fully Broken Armour"],
    ["armourBreakDuration", "Armour Break Duration", "Native PoB parsing is incomplete", "10% increased Armour Break Duration"],
    ["lifeRegenerationPercent", "Life Regeneration (% Life)", "not divided by 60 again", "0.2% of maximum Life regenerated per second"],
    ["manaCostEfficiency", "Mana Cost Efficiency", "Increased efficiency divides cost", "10% increased Mana Cost Efficiency"],
    ["debuffExpirySpeed", "Debuff Expiry Speed", "Duration changes reciprocally", "Debuffs on you expire 10% faster"],
    ["recoupSpeed", "Recoup Speed", "does not grant recoup", "10% increased speed of Recoup Effects"],
    ["lifeRecoveryOnKill", "Life Recovery on Kill", "Kill frequency", "Recover 1% of maximum Life on Kill"],
    ["manaRecoveryOnKill", "Mana Recovery on Kill", "not flat Mana", "Recover 1% of maximum Mana on Kill"],
    ["flaskEffectDuration", "Flask Effect Duration", "not again as flask recovery", "10% increased Flask Effect Duration"],
    ["minionAreaOfEffect", "Minion Area of Effect", "not player Area of Effect, radius percentage or area damage", "10% increased minion Area of Effect"],
    ["minionMovementSpeed", "Minion Movement Speed", "not player movement or minion attack/cast speed", "5% increased minion Movement Speed"],
    ["minionFireResistance", "Minion Fire Resistance", "not player resistance, increased resistance or maximum resistance", "+5% to minion Fire Resistance"],
    ["minionColdResistance", "Minion Cold Resistance", "once to each selected Fire/Cold/Lightning preference, never Chaos", "+5% to minion Cold Resistance"],
    ["minionLightningResistance", "Minion Lightning Resistance", "Caps, overcapping, inheritance and actual mitigation are not simulated", "+5% to minion Lightning Resistance"],
    ["minionChaosResistance", "Minion Chaos Resistance", "once to each selected Fire/Cold/Lightning preference, never Chaos", "+5% to minion Chaos Resistance"],
    ["minionEvasion", "Minion Evasion Rating", "not player evasion or added evade chance", "12% increased minion Evasion Rating"],
    ["minionPhysicalDamageReduction", "Minion Physical Damage Reduction", "Native total reduction caps at 90%", "3% additional minion Physical Damage Reduction"],
    ["minionLifeRecoup", "Minion Life Recoup", "Native default recovery is over 8 seconds", "3% of minion Damage taken Recouped as Life"],
    ["minionMaximumFireResistance", "Minion Maximum Fire Resistance", "Requires enough ordinary resistance to benefit", "+1% to minion Maximum Fire Resistance"],
    ["minionMaximumColdResistance", "Minion Maximum Cold Resistance", "native cap is 90%", "+1% to minion Maximum Cold Resistance"],
    ["minionMaximumLightningResistance", "Minion Maximum Lightning Resistance", "Caps, overrides and actual mitigation are not calculated", "+1% to minion Maximum Lightning Resistance"],
    ["minionCommandDamage", "Minion Command Skill Damage", "not basic attacks, all minion damage or player damage", "10% increased minion Damage with Command Skills"],
    ["minionCommandCooldownRecovery", "Minion Command Cooldown Recovery", "not minion attack/cast speed, player cooldowns or a linear reduction", "10% increased minion Cooldown Recovery Rate for Command Skills"],
    ["minionDuration", "Temporary Minion Duration", "not persistent-minion uptime, revive speed, command cooldown or generic skill duration", "10% increased Minion Duration"],
    ["minionReservationEfficiency", "Minion Reservation Efficiency", "Reservation uses reciprocal scaling and rounding", "5% increased Reservation Efficiency of Minion Skills"],
    ["companionDamage", "Companion Damage", "broader minion bonuses can also apply and have separate preferences", "10% increased Companion Damage"],
    ["companionLife", "Companion Maximum Life", "not player Life, recovery or damage-sharing mitigation", "10% increased Companion maximum Life"],
    ["companionAttackSpeed", "Companion Attack Speed", "not Companion cast speed, movement, commands or cooldown recovery", "3% increased Companion Attack Speed"],
    ["companionMovementSpeed", "Companion Movement Speed", "mounted-player movement and actual combat uptime are not simulated", "5% increased Companion Movement Speed"],
    ["companionAreaOfEffect", "Companion Area of Effect", "Basic single-target attacks do not gain an area", "10% increased Companion Area of Effect"],
    ["companionFireResistance", "Companion Fire Resistance", "not maximum resistance or player defence", "+5% to Companion Fire Resistance"],
    ["companionColdResistance", "Companion Cold Resistance", "once to each selected Companion Fire/Cold/Lightning preference, never Chaos", "+5% to Companion Cold Resistance"],
    ["companionLightningResistance", "Companion Lightning Resistance", "caps, overcapping and actual mitigation are not simulated", "+5% to Companion Lightning Resistance"],
    ["companionChaosResistance", "Companion Chaos Resistance", "Broader minion resistance preferences are separate", "+5% to Companion Chaos Resistance"],
    ["companionReservationEfficiency", "Companion Reservation Efficiency", "separate from broader Minion Reservation Efficiency", "5% increased Reservation Efficiency of Companion Skills"],
  ])("offers opt-in %s with concise scope help and the existing priority/remove controls", (id, label, explanation, unit) => {
    const settings: PassiveOptimizationSettings = { ...weightedSettings(), preferences: [] };
    const onChange = vi.fn<(settings: PassiveOptimizationSettings) => void>();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);
    expect(screen.queryByRole("combobox", { name: `${label} priority` })).toBeNull();
    selectPickerOption(screen.getByRole("combobox", { name: "Add effect preference" }), id);
    const selected = onChange.mock.calls[0][0];
    expect(selected.preferences).toEqual([{ id, weight: 1 }]);
    rerender(<PassivePreferenceControls settings={selected} onChange={onChange} disabled={false} />);
    const tip = document.getElementById(`preference-${id}-tooltip`)?.textContent;
    expect(tip).toContain(explanation);
    expect(tip).toContain(`Normal: 1 score per ${unit}`);
    expect(tip).toContain("Unconditional effects only");
    fireEvent.change(screen.getByRole("combobox", { name: `${label} priority` }), { target: { value: "3" } });
    expect(onChange.mock.calls[1][0].preferences).toEqual([{ id, weight: 3 }]);
    fireEvent.click(screen.getByRole("button", { name: `Remove ${label} preference` }));
    expect(onChange.mock.calls[2][0].preferences).toEqual([]);
  });
  it("explains Fireball spell-area coverage in the existing tooltip without changing controls or manual priorities", () => {
    const settings: PassiveOptimizationSettings = { ...weightedSettings(), focusSkillId: "fireball", preferences: [{ id: "areaOfEffect", weight: 3 }] };
    const onChange = vi.fn();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);
    const tip = () => document.getElementById("preference-areaOfEffect-tooltip")?.textContent;
    expect(tip()).toContain("For Fireball, includes Spell Skills have increased/reduced Area of Effect once");
    expect(tip()).toContain("explosion coverage, not hit damage");
    expect(tip()).toContain("Select Spell Area Damage separately to score Roil/Ruin's damage tradeoffs");
    expect(screen.getAllByRole("combobox")).toHaveLength(4);
    expect((screen.getByRole("combobox", { name: "Area of Effect priority" }) as HTMLSelectElement).value).toBe("3");
    rerender(<PassivePreferenceControls settings={{ ...settings, supportGemIds: ["controlled-destruction"] }} onChange={onChange} disabled={false} />);
    expect(tip()).toContain("For Fireball, includes Spell Skills");
    rerender(<PassivePreferenceControls settings={{ ...settings, focusSkillId: "spark" }} onChange={onChange} disabled={false} />);
    expect(tip()).toContain("Spell-only Area of Effect requires a reviewed area-spell focus");
    expect(onChange).not.toHaveBeenCalled();
  });
  it("uses one existing priority row for Spell Area Damage and explains its separate Fireball tradeoffs", () => {
    const settings: PassiveOptimizationSettings = { ...weightedSettings(), focusSkillId: "fireball", preferences: [{ id: "spellAreaDamage", weight: 2 }] };
    const onChange = vi.fn();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);
    const tip = () => document.getElementById("preference-spellAreaDamage-tooltip")?.textContent;
    expect(tip()).toContain("explosion only");
    expect(tip()).toContain("Ruin's +35% damage and Roil's -10% damage count once here");
    expect(tip()).toContain("Their area changes count only under Area of Effect");
    expect(tip()).toContain("10% increased Spell Area Damage");
    expect(screen.getAllByRole("combobox")).toHaveLength(4);
    expect((screen.getByRole("combobox", { name: "Spell Area Damage priority" }) as HTMLSelectElement).value).toBe("2");
    rerender(<PassivePreferenceControls settings={{ ...settings, focusSkillId: "spark" }} onChange={onChange} disabled={false} />);
    expect(tip()).toContain("Ignored without a reviewed spell-area damage focus");
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Remove Spell Area Damage preference" }));
    expect(onChange).toHaveBeenCalledWith({ ...settings, focusSkillId: "spark", preferences: [] });
  });
  it.each([["ice-strike", "Quarterstaves"], ["tempest-flurry", "Quarterstaves"], ["lightning-spear", "Spears"], ["explosive-spear", "Spears"]])
    ("explains optional weapon critical chance for %s without selecting it or adding controls", (focusSkillId, weapon) => {
      const settings: PassiveOptimizationSettings = { ...weightedSettings(), focusSkillId };
      const onChange = vi.fn();
      const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);
      expect(screen.queryByRole("combobox", { name: "Critical Hit Chance priority" })).toBeNull();
      expect(document.getElementById("preference-criticalChance-tooltip")).toBeNull();
      const selected: PassiveOptimizationSettings = { ...settings, preferences: [...settings.preferences, { id: "criticalChance", weight: 2 }] };
      rerender(<PassivePreferenceControls settings={selected} onChange={onChange} disabled={false} />);
      expect(document.getElementById("preference-criticalChance-tooltip")?.textContent).toContain(`Critical Hit Chance with ${weapon} once, including reductions`);
      expect(document.getElementById("preference-criticalChance-tooltip")?.textContent).toContain("Scores only while this preference is selected");
      expect(screen.getAllByRole("combobox")).toHaveLength(5);
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Remove Critical Hit Chance preference" }));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(settings);
    });
  it.each(["ice-strike", "tempest-flurry", "boneshatter", "rolling-slam"])("explains Melee Damage in the existing Attack Damage tooltip for %s", (focusSkillId) => {
    const settings: PassiveOptimizationSettings = { ...weightedSettings(), focusSkillId, preferences: [{ id: "attackDamage", weight: 3 }] };
    const onChange = vi.fn();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);
    expect(document.getElementById("preference-attackDamage-tooltip")?.textContent).toContain("Unconditional Melee Damage also adds to Attack Damage once");
    expect(screen.getAllByRole("combobox")).toHaveLength(4);
    rerender(<PassivePreferenceControls settings={{ ...settings, focusSkillId: "lightning-spear" }} onChange={onChange} disabled={false} />);
    expect(document.getElementById("preference-attackDamage-tooltip")?.textContent).not.toContain("Unconditional Melee Damage also adds");
    expect(onChange).not.toHaveBeenCalled();
  });
  it.each([["ice-shot", "Bows"], ["lightning-spear", "Spears"], ["ice-strike", "Quarterstaves"], ["boneshatter", "Maces"]])("explains weapon damage/speed matching for %s in existing tooltips", (focusSkillId, weapon) => {
    const settings: PassiveOptimizationSettings = { ...weightedSettings(), focusSkillId,
      preferences: [{ id: "attackDamage", weight: 3 }, { id: "attackSpeed", weight: 2 }] };
    const onChange = vi.fn();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);
    expect(document.getElementById("preference-attackDamage-tooltip")?.textContent).toContain(`Damage with ${weapon} adds to Attack Damage once, including reductions`);
    expect(document.getElementById("preference-attackSpeed-tooltip")?.textContent).toContain(`Attack Speed with ${weapon} adds to Attack Speed once, including reductions`);
    expect(document.getElementById("preference-attackDamage-tooltip")?.textContent).toContain("Other weapon bonuses are ignored");
    rerender(<PassivePreferenceControls settings={{ ...settings, focusSkillId: "spark" }} onChange={onChange} disabled={false} />);
    expect(document.getElementById("preference-attackDamage-tooltip")?.textContent).toContain("require a reviewed matching attack focus");
    expect(screen.getAllByRole("combobox")).toHaveLength(5);
    expect(onChange).not.toHaveBeenCalled();
  });
  it("explains scoped damage, component limits and spell critical blocking without extra controls", () => {
    const settings: PassiveOptimizationSettings = { ...weightedSettings(), focusSkillId: "tempest-flurry", preferences: [
      { id: "attackAreaDamage", weight: 1 }, { id: "elementalDamage", weight: 2 }, { id: "criticalDamageBonus", weight: 3 },
    ] };
    const onChange = vi.fn();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);
    const tip = (id: string) => document.getElementById(`preference-${id}-tooltip`)?.textContent;
    expect(tip("attackAreaDamage")).toContain("Normal Strikes only, not Third or Fourth Strike");
    expect(tip("elementalDamage")).toContain("Elemental Damage with Attacks adds here once");
    expect(tip("criticalDamageBonus")).toContain("Critical Damage Bonus for Attack Damage adds here once");
    rerender(<PassivePreferenceControls settings={{ ...settings, focusSkillId: "explosive-spear" }} onChange={onChange} disabled={false} />);
    expect(tip("attackAreaDamage")).toContain("not the travelling spear or ground effects");
    rerender(<PassivePreferenceControls settings={{ ...settings, focusSkillId: "fireball" }} onChange={onChange} disabled={false} />);
    expect(tip("attackAreaDamage")).toContain("Ignored without a reviewed attack-area damage focus");
    expect(tip("elementalDamage")).toContain("Gear-added elements and conversions are not inferred");
    expect(tip("criticalDamageBonus")).toContain("Critical Spell Damage Bonus adds here once");
    rerender(<PassivePreferenceControls settings={{ ...settings, focusSkillId: "fireball", supportGemIds: ["controlled-destruction"] }} onChange={onChange} disabled={false} />);
    expect(tip("criticalDamageBonus")).toContain("Controlled Destruction blocks Critical Spell Damage Bonus");
    expect(tip("criticalDamageBonus")).toContain("Generic manual critical damage bonus still counts");
    expect(onChange).not.toHaveBeenCalled();
  });
  it.each([["ice-shot", "Bows"], ["lightning-spear", "Spears"], ["ice-strike", "Quarterstaves"]])
    ("explains weapon accuracy and critical damage for %s in existing optional rows", (focusSkillId, weapon) => {
      const settings: PassiveOptimizationSettings = { ...weightedSettings(), focusSkillId,
        preferences: [{ id: "accuracy", weight: 2 }, { id: "criticalDamageBonus", weight: 3 }] };
      const onChange = vi.fn();
      const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);
      const tip = (id: string) => document.getElementById(`preference-${id}-tooltip`)?.textContent;
      expect(tip("accuracy")).toContain(`Accuracy Rating with ${weapon} adds here once, including reductions`);
      expect(tip("accuracy")).toContain("not final hit chance");
      expect(tip("criticalDamageBonus")).toContain(`Critical Damage Bonus with ${weapon} once, including reductions`);
      expect(tip("criticalDamageBonus")).toContain("not under Critical Hit Chance");
      expect(screen.getAllByRole("combobox")).toHaveLength(5);
      rerender(<PassivePreferenceControls settings={{ ...settings, focusSkillId: "fireball" }} onChange={onChange} disabled={false} />);
      expect(tip("accuracy")).toContain("Weapon-only Accuracy Rating is ignored");
      expect(tip("criticalDamageBonus")).not.toContain(`Critical Damage Bonus with ${weapon} once`);
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Remove Accuracy Rating preference" }));
      expect(onChange).toHaveBeenCalledWith({ ...settings, focusSkillId: "fireball", preferences: [{ id: "criticalDamageBonus", weight: 3 }] });
    });
  it.each([["ice-strike", "Quarterstaves"], ["tempest-flurry", "Quarterstaves"], ["boneshatter", "Maces"], ["rolling-slam", "Maces"]])
    ("explains scoped buildup application requirements for %s in existing optional rows", (focusSkillId, weapon) => {
      const settings: PassiveOptimizationSettings = { ...weightedSettings(), focusSkillId,
        preferences: [{ id: "stunBuildup", weight: 2 }, { id: "freezeBuildup", weight: 3 }] };
      const onChange = vi.fn();
      const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);
      const tip = (id: string) => document.getElementById(`preference-${id}-tooltip`)?.textContent;
      expect(tip("stunBuildup")).toContain("Stun Buildup with Melee Damage adds here once");
      expect(tip("stunBuildup")).toContain(`Stun Buildup with ${weapon} once`);
      expect(tip("stunBuildup")).toContain("add, not multiply");
      if (focusSkillId === "boneshatter") expect(tip("stunBuildup")).toContain("Shockwave only, not the initial strike");
      if (focusSkillId === "rolling-slam") expect(tip("stunBuildup")).toContain("not the non-damaging sequence wrapper");
      if (focusSkillId === "ice-strike") {
        expect(tip("freezeBuildup")).toContain("Freeze Buildup with Quarterstaves adds here once");
        expect(tip("freezeBuildup")).toContain("grants neither cold damage nor freeze chance");
      } else expect(tip("freezeBuildup")).toContain("Quarterstaff-only Freeze Buildup is ignored");
      expect(screen.getAllByRole("combobox")).toHaveLength(5);
      rerender(<PassivePreferenceControls settings={{ ...settings, focusSkillId: "fireball" }} onChange={onChange} disabled={false} />);
      expect(tip("stunBuildup")).toContain("Melee/weapon-only Stun Buildup is ignored");
      expect(onChange).not.toHaveBeenCalled();
    });
  it.each(["ice-strike", "ice-shot", "boneshatter"])("explains handedness eligibility and overlap for %s in existing tooltips", (focusSkillId) => {
    const settings: PassiveOptimizationSettings = { ...weightedSettings(), focusSkillId,
      preferences: [{ id: "attackDamage", weight: 2 }, { id: "accuracy", weight: 3 }] };
    const onChange = vi.fn();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);
    const tip = (id: string) => document.getElementById(`preference-${id}-tooltip`)?.textContent;
    if (focusSkillId !== "boneshatter") expect(tip("attackDamage")).toContain("Damage with Two Handed Weapons also adds to Attack Damage once");
    else expect(tip("attackDamage")).toContain("mace equipment is not inferred");
    if (focusSkillId === "ice-strike") expect(tip("accuracy")).toContain("Accuracy Rating with Two Handed Melee Weapons once");
    else expect(tip("accuracy")).toContain("does not apply to bows");
    expect(screen.getAllByRole("combobox")).toHaveLength(5);
    rerender(<PassivePreferenceControls settings={{ ...settings, focusSkillId: "spark" }} onChange={onChange} disabled={false} />);
    expect(tip("attackDamage")).toContain("requires a reviewed two-handed hit focus");
    expect(onChange).not.toHaveBeenCalled();
  });
  it.each(["lightning-spear", "explosive-spear"])("explains one-handed %s classification and overlap in existing tooltips", (focusSkillId) => {
    const settings: PassiveOptimizationSettings = { ...weightedSettings(), focusSkillId,
      preferences: [{ id: "attackDamage", weight: 2 }, { id: "attackSpeed", weight: 3 }, { id: "accuracy", weight: 1 }] };
    const onChange = vi.fn();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);
    const tip = (id: string) => document.getElementById(`preference-${id}-tooltip`)?.textContent;
    expect(tip("attackDamage")).toContain("Damage with One Handed Weapons also adds to Attack Damage once");
    expect(tip("attackSpeed")).toContain("one-handed melee-weapon Attack Speed add here once");
    expect(tip("attackSpeed")).toContain("neither line scores as Cast Speed or Skill Speed");
    expect(tip("accuracy")).toContain("Accuracy Rating with One Handed Melee Weapons once");
    expect(tip("accuracy")).toContain("weapon classification, not melee damage");
    expect(screen.getAllByRole("combobox")).toHaveLength(6);
    rerender(<PassivePreferenceControls settings={{ ...settings, focusSkillId: "boneshatter" }} onChange={onChange} disabled={false} />);
    expect(tip("attackDamage")).toContain("mace equipment is not inferred");
    expect(tip("attackSpeed")).not.toContain("one-handed melee-weapon Attack Speed add here once");
    expect(tip("accuracy")).not.toContain("Accuracy Rating with One Handed Melee Weapons once");
    expect(onChange).not.toHaveBeenCalled();
  });
  it.each(["lightning-spear", "explosive-spear"])("explains critical and ailment application limits for %s without extra controls", (focusSkillId) => {
    const settings: PassiveOptimizationSettings = { ...weightedSettings(), focusSkillId,
      preferences: [{ id: "criticalChance", weight: 2 }, { id: "criticalDamageBonus", weight: 3 }, { id: "ailmentChance", weight: 1 }] };
    const onChange = vi.fn();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);
    const tip = (id: string) => document.getElementById(`preference-${id}-tooltip`)?.textContent;
    expect(tip("criticalChance")).toContain("Critical Hit Chance with One Handed Melee Weapons once");
    expect(tip("criticalChance")).toContain("weapon classification, not melee damage");
    expect(tip("criticalChance")).toContain("nonzero base critical chance");
    expect(tip("criticalDamageBonus")).toContain("Critical Damage Bonus with One Handed Melee Weapons once");
    expect(tip("criticalDamageBonus")).toContain("not the whole critical multiplier");
    expect(tip("criticalDamageBonus")).toContain("handedness sources add, not multiply");
    expect(tip("ailmentChance")).toContain("one-handed attack ailment chance adds here once");
    expect(tip("ailmentChance")).toContain("grants no Poison or Bleeding chance");
    expect(tip("ailmentChance")).toContain("not to flat Poison/Bleeding/Daze chance");
    expect(tip("ailmentChance")).toContain("caps and prohibitions are not simulated");
    expect(screen.getAllByRole("combobox")).toHaveLength(6);
    for (const focusSkillId of ["boneshatter", "spark", undefined]) {
      rerender(<PassivePreferenceControls settings={{ ...settings, focusSkillId }} onChange={onChange} disabled={false} />);
      expect(tip("criticalChance")).not.toContain("Critical Hit Chance with One Handed Melee Weapons once");
      expect(tip("criticalDamageBonus")).not.toContain("Critical Damage Bonus with One Handed Melee Weapons once");
      expect(tip("ailmentChance")).toContain("mace handedness is not inferred");
      expect(tip("ailmentChance")).toContain("Generic manual ailment chance still counts");
    }
    expect(onChange).not.toHaveBeenCalled();
  });
  it.each(["spark", "essence-drain", "detonate-dead", "unearth"])("explains Blind/Hinder player-hit application for %s in existing tooltips", (focusSkillId) => {
    const settings: PassiveOptimizationSettings = { ...weightedSettings(), focusSkillId,
      preferences: [{ id: "blindChance", weight: 2 }, { id: "hinderChance", weight: 3 }] };
    const onChange = vi.fn();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);
    const tip = (id: string) => document.getElementById(`preference-${id}-tooltip`)?.textContent;
    expect(tip("blindChance")).toContain("Attack-only Blind chance requires a reviewed player attack-hit focus");
    expect(tip("hinderChance")).toContain("spell-hit Hinder chance counts once");
    expect(tip("hinderChance")).toContain("Native PoB does not fully parse this wording");
    if (focusSkillId === "essence-drain") expect(tip("hinderChance")).toContain("Initial projectile hit only, not the DoT debuff");
    if (focusSkillId === "detonate-dead") expect(tip("hinderChance")).toContain("does not enable Spell Damage scaling");
    if (focusSkillId === "unearth") expect(tip("hinderChance")).toContain("not hits from summoned constructs");
    expect(screen.getAllByRole("combobox")).toHaveLength(5);
    rerender(<PassivePreferenceControls settings={{ ...settings, focusSkillId: "lightning-arrow" }} onChange={onChange} disabled={false} />);
    expect(tip("blindChance")).toContain("attack-hit Blind chance adds to generic Blind chance once");
    expect(tip("hinderChance")).toContain("Ignored without a reviewed player spell-hit focus");
    for (const focusSkillId of ["contagion", "dark-effigy", "bone-offering", "skeletal-arsonist", undefined]) {
      rerender(<PassivePreferenceControls settings={{ ...settings, focusSkillId }} onChange={onChange} disabled={false} />);
      expect(tip("blindChance")).toContain("not minion/proxy hits");
      expect(tip("hinderChance")).toContain("Casting a curse, Offering or Totem does not itself supply a player hit");
    }
    expect(onChange).not.toHaveBeenCalled();
  });
  it.each(["lightning-arrow", "lightning-spear"])("explains attack control application and separate Knockback source requirements for %s", (focusSkillId) => {
    const settings: PassiveOptimizationSettings = { ...weightedSettings(), focusSkillId,
      preferences: [{ id: "knockbackDistance", weight: 1 }, { id: "maimChance", weight: 2 }, { id: "incisionChance", weight: 3 }] };
    const onChange = vi.fn();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);
    const tip = (id: string) => document.getElementById(`preference-${id}-tooltip`)?.textContent;
    expect(tip("knockbackDistance")).toContain("Requires an applicable Knockback source; does not grant it");
    for (const id of ["maimChance", "incisionChance"]) {
      expect(tip(id)).toContain("counts once on reviewed player attack-hit components only");
      expect(tip(id)).toContain("No existing debuff state is assumed");
    }
    expect(tip("incisionChance")).toContain("not Bleeding chance");
    expect(tip("incisionChance")).toContain("The ten-Incision variant is excluded");
    expect(screen.getAllByRole("combobox")).toHaveLength(6);
    for (const focusSkillId of ["spark", "contagion", "dark-effigy", "skeletal-arsonist", undefined]) {
      rerender(<PassivePreferenceControls settings={{ ...settings, focusSkillId }} onChange={onChange} disabled={false} />);
      for (const id of ["maimChance", "incisionChance"]) expect(tip(id)).toContain("Ignored without a reviewed player attack-hit focus");
      expect(tip("knockbackDistance")).toContain("Requires an applicable Knockback source");
    }
    expect(onChange).not.toHaveBeenCalled();
  });
  it("explains generic area component limits and optional selection using existing controls only", () => {
    const settings: PassiveOptimizationSettings = { ...weightedSettings(), focusSkillId: "fireball", preferences: [{ id: "areaDamage", weight: 2 }] };
    const onChange = vi.fn();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);
    const tip = () => document.getElementById("preference-areaDamage-tooltip")?.textContent;
    expect(tip()).toContain("generic Area Damage counts once");
    expect(tip()).toContain("explosion only");
    expect(tip()).toContain("not to count this line again");
    expect(screen.getAllByRole("combobox")).toHaveLength(4);
    for (const focusSkillId of ["tempest-flurry", "explosive-spear", "contagion", undefined]) {
      rerender(<PassivePreferenceControls settings={{ ...settings, focusSkillId }} onChange={onChange} disabled={false} />);
      expect(tip()).toContain(focusSkillId === "tempest-flurry" ? "Normal Strikes only" : focusSkillId === "explosive-spear"
        ? "not the travelling spear or ground effects" : "Ignored without a reviewed damaging area-component focus");
    }
    expect(onChange).not.toHaveBeenCalled();
  });
  it("explains critical/area scope and support blocking without adding controls or changing preferences", () => {
    const settings: PassiveOptimizationSettings = { ...weightedSettings(), focusSkillId: "spark",
      preferences: [{ id: "criticalChance", weight: 3 }, { id: "areaOfEffect", weight: 1 }] };
    const onChange = vi.fn();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);
    const tip = (id: string) => document.getElementById(`preference-${id}-tooltip`)?.textContent;
    expect(tip("criticalChance")).toContain("spell-only critical chance counts");
    expect(tip("areaOfEffect")).toContain("Attack-only Area of Effect is ignored");
    rerender(<PassivePreferenceControls settings={{ ...settings, supportGemIds: ["controlled-destruction"] }} onChange={onChange} disabled={false} />);
    expect(tip("criticalChance")).toContain("Controlled Destruction blocks spell-only crit");
    expect(tip("criticalChance")).toContain("Generic manual crit still counts");
    rerender(<PassivePreferenceControls settings={{ ...settings, focusSkillId: "lightning-arrow" }} onChange={onChange} disabled={false} />);
    expect(tip("criticalChance")).toContain("attack-only critical chance counts");
    expect(tip("areaOfEffect")).toContain("coverage, not hit damage");
    expect(onChange).not.toHaveBeenCalled();
  });
  it("explains whether spell-scoped projectile speed counts for the current focus", () => {
    const settings: PassiveOptimizationSettings = { ...weightedSettings(), focusSkillId: "spark", preferences: [{ id: "projectileSpeed", weight: 3 }] };
    const onChange = vi.fn();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);
    expect(document.getElementById("preference-projectileSpeed-tooltip")?.textContent).toContain("For Spark, includes Projectile Speed for Spell Skills (increased and reduced)");
    rerender(<PassivePreferenceControls settings={{ ...settings, focusSkillId: "lightning-arrow" }} onChange={onChange} disabled={false} />);
    expect(document.getElementById("preference-projectileSpeed-tooltip")?.textContent).toContain("Spell-only projectile speed is ignored");
    expect(onChange).not.toHaveBeenCalled();
  });
  it("defaults to extra points with a bounded input and both budget choices", () => {
    render(<PassivePreferenceControls settings={weightedSettings()} onChange={vi.fn()} disabled={false} />);

    const budgetMode = screen.getByRole("combobox", { name: "Point budget" }) as HTMLSelectElement;
    expect(budgetMode.value).toBe("extra");
    expect(Array.from(budgetMode.options, (option) => option.value)).toEqual(["extra", "all-available"]);
    expect((within(budgetMode).getByRole("option", { name: "Use all available (123 total)" }) as HTMLOptionElement).value)
      .toBe("all-available");

    const extraPoints = screen.getByRole("spinbutton", { name: "Extra points" }) as HTMLInputElement;
    expect(extraPoints.value).toBe("7");
    expect(extraPoints.min).toBe("0");
    expect(extraPoints.max).toBe("123");
    expect(extraPoints.step).toBe("1");
    expect((screen.getByRole("button", { name: "Decrease extra points" }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole("button", { name: "Increase extra points" }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByText(/points reserved for weapon sets/)).toBeNull();
  });

  it("preserves the edited extra budget and preferences when switching to all available and back", () => {
    const settings = weightedSettings();
    const onChange = vi.fn<(settings: PassiveOptimizationSettings) => void>();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);

    fireEvent.change(screen.getByRole("spinbutton", { name: "Extra points" }), { target: { value: "9" } });

    const editedSettings = onChange.mock.calls[0][0];
    expect(editedSettings).toEqual({ ...settings, extraPointBudget: 9 });
    rerender(<PassivePreferenceControls settings={editedSettings} onChange={onChange} disabled={false} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Point budget" }), { target: { value: "all-available" } });

    const allAvailableSettings = onChange.mock.calls[1][0];
    expect(allAvailableSettings).toEqual({ ...editedSettings, pointBudgetMode: "all-available" });
    rerender(<PassivePreferenceControls settings={allAvailableSettings} onChange={onChange} disabled={false} />);

    expect(screen.queryByRole("spinbutton", { name: "Extra points" })).toBeNull();
    const budgetMode = screen.getByRole("combobox", { name: "Point budget" }) as HTMLSelectElement;
    expect(budgetMode.value).toBe("all-available");
    expect(budgetMode.selectedOptions[0].textContent).toBe("Use all available (123 total)");
    expect(screen.queryByText(/points reserved for weapon sets/)).toBeNull();

    fireEvent.change(budgetMode, { target: { value: "extra" } });

    const restoredSettings = onChange.mock.calls[2][0];
    expect(restoredSettings).toMatchObject(editedSettings);
    expect(restoredSettings.pointBudgetMode ?? "extra").toBe("extra");
    rerender(<PassivePreferenceControls settings={restoredSettings} onChange={onChange} disabled={false} />);

    expect((screen.getByRole("spinbutton", { name: "Extra points" }) as HTMLInputElement).value).toBe("9");
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(settings).toEqual(weightedSettings());
  });

  it("increments and decrements extra points by one using complete settings snapshots", () => {
    const settings = weightedSettings();
    const onChange = vi.fn<(settings: PassiveOptimizationSettings) => void>();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Increase extra points" }));

    const increasedSettings = onChange.mock.calls[0][0];
    expect(increasedSettings).toEqual({ ...settings, extraPointBudget: 8 });
    rerender(<PassivePreferenceControls settings={increasedSettings} onChange={onChange} disabled={false} />);
    expect((screen.getByRole("spinbutton", { name: "Extra points" }) as HTMLInputElement).value).toBe("8");

    fireEvent.click(screen.getByRole("button", { name: "Decrease extra points" }));

    expect(onChange).toHaveBeenNthCalledWith(2, settings);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(settings).toEqual(weightedSettings());
  });

  it.each([
    { budget: 0, blocked: "Decrease extra points", allowed: "Increase extra points", nextBudget: 1 },
    { budget: 123, blocked: "Increase extra points", allowed: "Decrease extra points", nextBudget: 122 },
  ])("disables the outward stepper at $budget and re-enables it after stepping inward", ({ budget, blocked, allowed, nextBudget }) => {
    const settings = { ...weightedSettings(), extraPointBudget: budget };
    const onChange = vi.fn<(settings: PassiveOptimizationSettings) => void>();
    const { rerender } = render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} />);

    const blockedButton = screen.getByRole("button", { name: blocked }) as HTMLButtonElement;
    const allowedButton = screen.getByRole("button", { name: allowed }) as HTMLButtonElement;
    expect(blockedButton.disabled).toBe(true);
    expect(allowedButton.disabled).toBe(false);
    fireEvent.click(blockedButton);
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(allowedButton);

    const nextSettings = onChange.mock.calls[0][0];
    expect(nextSettings).toEqual({ ...settings, extraPointBudget: nextBudget });
    rerender(<PassivePreferenceControls settings={nextSettings} onChange={onChange} disabled={false} />);

    const returnButton = screen.getByRole("button", { name: blocked }) as HTMLButtonElement;
    expect(returnButton.disabled).toBe(false);
    fireEvent.click(returnButton);
    expect(onChange).toHaveBeenNthCalledWith(2, settings);
    rerender(<PassivePreferenceControls settings={onChange.mock.calls[1][0]} onChange={onChange} disabled={false} />);

    expect((screen.getByRole("spinbutton", { name: "Extra points" }) as HTMLInputElement).value).toBe(String(budget));
    expect((screen.getByRole("button", { name: blocked }) as HTMLButtonElement).disabled).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it.each(["extra", "all-available"] as const)("disables controls while running in %s mode", (pointBudgetMode) => {
    const settings = { ...weightedSettings(), pointBudgetMode };
    const onChange = vi.fn();
    render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled />);

    expect(screen.getByRole("combobox", { name: "Point budget" }).matches(":disabled")).toBe(true);
    for (const role of ["radio", "combobox", "spinbutton", "button"]) {
      for (const control of screen.queryAllByRole(role)) {
        if (control.classList.contains("info-trigger")) { expect(control.matches(":disabled")).toBe(false); continue; }
        expect(control.matches(":disabled")).toBe(true);
      }
    }
    if (pointBudgetMode === "extra") {
      expect(screen.getByRole("spinbutton", { name: "Extra points" }).matches(":disabled")).toBe(true);
      fireEvent.click(screen.getByRole("button", { name: "Decrease extra points" }));
      fireEvent.click(screen.getByRole("button", { name: "Increase extra points" }));
    } else {
      expect(screen.queryByRole("spinbutton", { name: "Extra points" })).toBeNull();
    }
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows the weapon-set reserve with a 99-point main limit in all-available mode", () => {
    const settings: PassiveOptimizationSettings = { ...weightedSettings(), pointBudgetMode: "all-available" };
    const onChange = vi.fn();
    render(<PassivePreferenceControls settings={settings} onChange={onChange} disabled={false} mainPointLimit={99} />);

    expect(screen.getByText("24 points reserved for weapon sets.")).not.toBeNull();
    expect(within(screen.getByRole("combobox", { name: "Point budget" }))
      .getByRole("option", { name: "Use all available (123 total)" })).not.toBeNull();
    expect(settings.extraPointBudget).toBe(7);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("hides weighted budget controls for the shortest objective", () => {
    render(<PassivePreferenceControls settings={{ ...weightedSettings(), mode: "shortest" }} onChange={vi.fn()} disabled={false} />);

    expect(screen.queryByRole("combobox", { name: "Point budget" })).toBeNull();
    expect(screen.queryByRole("spinbutton", { name: "Extra points" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Decrease extra points" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Increase extra points" })).toBeNull();
  });
});

function weightedSettings(): PassiveOptimizationSettings {
  return { mode: "weighted", extraPointBudget: 7, preferences: [{ id: "life", weight: 2 }] };
}
