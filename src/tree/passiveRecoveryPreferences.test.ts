import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { remainingCooldownIds } from "./remainingAttackSkills.fixtures";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassivePreferenceId } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const cases = [
  ["energyShieldRechargeStart", "faster", "slower", "start of Energy Shield Recharge"],
  ["energyShieldRechargeRate", "increased", "reduced", "Energy Shield Recharge Rate"],
  ["lifeRegenerationRate", "increased", "reduced", "Life Regeneration rate"],
  ["manaRegenerationRate", "increased", "reduced", "Mana Regeneration Rate"],
  ["elementalAilmentThreshold", "increased", "reduced", "Elemental Ailment Threshold"],
  ["cooldownRecoveryRate", "increased", "reduced", "Cooldown Recovery Rate"],
  ["lifeFlaskRecovery", "increased", "reduced", "Life Recovery from Flasks"],
  ["manaFlaskRecovery", "increased", "reduced", "Mana Recovery from Flasks"],
] as const;

const spellUtilityRecoverySuggestions: Readonly<Record<string, readonly { id: PassivePreferenceId; weight: number }[]>> = {
  barrage: [{ id: "cooldownRecoveryRate", weight: 1 }],
  "alchemists-boon": [{ id: "lifeFlaskRecovery", weight: 2 },{ id: "manaFlaskRecovery", weight: 2 }],
  berserk: [{ id: "lifeRegenerationRate", weight: 1 }],
  "savage-fury": [{ id: "lifeRegenerationRate", weight: 1 }],
  "emergency-reload": [{ id: "cooldownRecoveryRate", weight: 2 }],
  convalescence: [{ id: "energyShieldRechargeRate", weight: 3 }],
  "ice-tipped-arrows": [{ id: "cooldownRecoveryRate", weight: 1 }],
  "mana-tempest": [{ id: "manaRegenerationRate", weight: 2 }],
  snap: [{ id: "cooldownRecoveryRate", weight: 1 }],
};

describe("unconditional recovery and threshold preferences", () => {
  it.each(cases)("adds positive/negative/decimal %s once, and scores it only when selected", (id, positive, negative, wording) => {
    const passive = node(`  12.5%   ${positive} ${wording.toUpperCase()}  `, `20% ${negative} ${wording}`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBeCloseTo(-1.5);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(scorePassiveNode(passive, [{ id: "energyShield", weight: 3 }, { id: "life", weight: 3 }, { id: "mana", weight: 3 }])).toBe(0);
    expect(passivePreferenceValues(node(`10% ${positive} ${wording}`, `10% ${negative} ${wording}`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`0% ${positive} ${wording}`))).toEqual({ [id]: 0 });
  });
  it.each(cases)("rejects conditional, owned, more/less and malformed wording for %s", (_id, positive, _negative, wording) => {
    expect(passivePreferenceValues(node(
      `10% ${positive} ${wording} while stationary`, `10% ${positive} ${wording}\nwhile Shapeshifted`,
      `10% ${positive} ${wording} if you've been Stunned Recently`, `10% ${positive} ${wording} per Power Charge`,
      `Minions have 10% ${positive} ${wording}`, `Enemies in your Presence have 10% ${positive} ${wording}`,
      `10% more ${wording}`, `10% less ${wording}`, `..% ${positive} ${wording}`, `NaN% ${positive} ${wording}`,
      `Infinity% ${positive} ${wording}`, `-10% ${positive} ${wording}`, `+10% ${positive} ${wording}`,
      `1.2.3% ${positive} ${wording}`, `.5% ${positive} ${wording}`, `10.% ${positive} ${wording}`,
      `10% ${positive} ${wording} and an unknown effect`,
    ))).toEqual({});
  });
  it("fans out combined flask recovery once per selected pool, including reductions", () => {
    const passive = node("20% increased Life and Mana Recovery from Flasks", "5% reduced Life and Mana Recovery from Flasks",
      "10% increased Life Recovery from Flasks", "2.5% reduced Mana Recovery from Flasks");
    expect(passivePreferenceValues(passive)).toEqual({ lifeFlaskRecovery: 25, manaFlaskRecovery: 12.5 });
    expect(scorePassiveNode(passive, [{ id: "lifeFlaskRecovery", weight: 2 }])).toBe(5);
    expect(scorePassiveNode(passive, [{ id: "manaFlaskRecovery", weight: 1 }])).toBe(1.25);
    expect(scorePassiveNode(passive, [{ id: "lifeFlaskRecovery", weight: 2 }, { id: "manaFlaskRecovery", weight: 1 }])).toBe(6.25);
    expect(passivePreferenceValues(node("10% increased Life and Mana Recovery from Flasks", "10% reduced Life and Mana Recovery from Flasks")))
      .toEqual({ lifeFlaskRecovery: 0, manaFlaskRecovery: 0 });
  });
  it("keeps threshold conversions, scoped cooldowns and other flask mechanics separate", () => {
    expect(passivePreferenceValues(node("Gain additional Ailment Threshold equal to 8% of maximum Energy Shield",
      "+4 to Ailment Threshold per Dexterity", "20% increased Enemy Ailment Threshold", "20% increased chance to inflict Ailments",
      "15% increased Cooldown Recovery Rate for Grenade Skills", "10% increased Warcry Cooldown Recovery Rate",
      "Minions have 20% increased Cooldown Recovery Rate", "Enemies in your Presence have 10% reduced Cooldown Recovery Rate",
      "Skills have -1 seconds to Cooldown", "Your Skills have no Cooldown", "20% increased Flask Life Recovery Rate",
      "20% reduced Flask Mana Recovery Rate", "10% increased Flask Charges gained while stationary", "10% increased Life Flask Charges gained while stationary",
      "25% increased Life Recovery from Flasks used when on Low Life", "40% increased Life and Mana Recovery from Flasks while you have an active Charm",
      "20% increased Life and Mana Recovery from Flasks and Charms", "10% increased maximum Life and Mana Recovery from Flasks",
      "Cannot use Charms\n30% more Recovery from Flasks", "Life Recharges instead of Energy Shield\n50% less Life Recovery from Flasks",
      "20% increased Life Recovery", "20% increased Recovery from Flasks", "20% increased Ailment Threshold",
      "20% increased Cooldown Recovery Speed", "20% increased Life and Mana Recovery from Flasks while stationary",
    ))).toEqual({ ailmentChance: 20, warcryCooldownRecoveryRate: 10 });
  });
  it("keeps timing/rate/regen distinct from maximum pools, flat recovery and conversions", () => {
    const passive = node("10% faster start of Energy Shield Recharge", "20% increased Energy Shield Recharge Rate",
      "30% increased Life Regeneration rate", "40% reduced Mana Regeneration Rate", "12% increased maximum Energy Shield",
      "+10 to maximum Life", "+15 to maximum Mana");
    expect(passivePreferenceValues(passive)).toEqual({ energyShieldRechargeStart: 10, energyShieldRechargeRate: 20,
      lifeRegenerationRate: 30, manaRegenerationRate: -40, energyShield: 12, life: 3, mana: 10 });
    expect(passivePreferenceValues(node("Regenerate 5 Life per second", "Regenerate 1% of maximum Life per second",
      "5 Mana Regeneration per second", "20% increased Life Recovery rate", "20% increased Mana Recovery rate",
      "20% increased Life and Mana Regeneration Rate for each Minion in your Presence, up to a maximum of 40%",
      "Life Recharges instead of Energy Shield", "Energy Shield does not Recharge", "Life Regeneration has no effect",
      "Your base Energy Shield Recharge Delay is 4 seconds", "10% increased start of Energy Shield Recharge",
      "10% reduced start of Energy Shield Recharge", "10% faster Mana Regeneration Rate"))).toEqual({ lifeRegenerationPercent: 1 });
  });
  it("does not change focus/support weights or add recovery preferences on normalization", () => {
    const defensiveRecoverySuggestions = { blink: 3, "arctic-armour": 1, "ghost-dance": 2, "grim-feast": 1, "time-of-need": 3 } as const;
    const preferences = cases.map(([id], i) => ({ id, weight: i % 3 + 1 }));
    const settings = { mode: "weighted", extraPointBudget: 7, focusSkillId: "fireball", supportGemIds: ["controlled-destruction"], preferences };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    expect(normalizePassiveOptimizationSettings({ mode: "weighted", preferences: [{ id: "energyShield", weight: 2 }] }).preferences)
      .toEqual([{ id: "energyShield", weight: 2 }]);
    const passive = node("10% faster start of Energy Shield Recharge", "20% increased Mana Regeneration Rate");
    expect(passivePreferenceValues(passive, settings)).toEqual(passivePreferenceValues(passive));
    expect(passivePreferenceValues(passive, { focusSkillId: "ice-strike", supportGemIds: ["concentrated-area"] })).toEqual(passivePreferenceValues(passive));
    for (const preset of skillPreferencePresets) {
      const suggested = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 7, preferences: [] }, preset);
      expect(suggested.preferences.filter((p) => cases.some(([id]) => id === p.id)), preset.id)
        .toEqual(preset.id === "archmage" ? [{ id: "manaRegenerationRate", weight: 2 }] : spellUtilityRecoverySuggestions[preset.id] ?? (preset.id in defensiveRecoverySuggestions
          ? [{ id: "cooldownRecoveryRate", weight: defensiveRecoverySuggestions[preset.id as keyof typeof defensiveRecoverySuggestions] }]
          : ["explosive-grenade", "lightning-conduit", "toxic-domain", "ravenous-swarm", ...remainingCooldownIds].includes(preset.id) ? [{ id: "cooldownRecoveryRate", weight: 2 }] : []));
    }
  });
  it("recognizes the reviewed 0.5.5f batch without broadening into conditional recovery", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(cases.map(([id]) => [id, 0]));
    const ids = new Set<string>();
    for (const passive of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) {
      const values = passivePreferenceValues(passive);
      for (const [id] of cases) if (Object.hasOwn(values, id)) { counts[id] += 1; ids.add(passive.id); }
    }
    expect(counts).toEqual({ energyShieldRechargeStart: 78, energyShieldRechargeRate: 2, lifeRegenerationRate: 32, manaRegenerationRate: 70,
      elementalAilmentThreshold: 23, cooldownRecoveryRate: 17, lifeFlaskRecovery: 28, manaFlaskRecovery: 15 });
    expect(ids.size).toBe(255);
    expect(passivePreferenceValues(graph.nodes["17973"])).toEqual({ energyShieldRechargeStart: 12, energyShieldRechargeRate: 12 });
    expect(passivePreferenceValues(graph.nodes["36623"])).toEqual({ energyShieldRechargeStart: 20, energyShieldRechargeRate: -10 });
    expect(passivePreferenceValues(graph.nodes["62230"])).toEqual({ energyShield: 50, energyShieldRechargeStart: -20 });
    expect(passivePreferenceValues(graph.nodes["4295"])).toEqual({ lifeRegenerationRate: -20, manaRecoup: 20 });
    expect(passivePreferenceValues(graph.nodes["116"])).toEqual({ manaRegenerationRate: 12, energyShield: 18 });
    expect(passivePreferenceValues(graph.nodes["10053"])).toEqual({ lifeFlaskRecovery: 20, manaFlaskRecovery: 20 });
    expect(passivePreferenceValues(graph.nodes["8810"])).toEqual({ cooldownRecoveryRate: 12, skillDuration: 15 });
    expect(passivePreferenceValues(graph.nodes["44765"])).toEqual({ cooldownRecoveryRate: 10 });
    expect(passivePreferenceValues(graph.nodes["17229"])).toEqual({ elementalAilmentThreshold: 20,
      minionFireResistance: 20, minionColdResistance: 20, minionLightningResistance: 20 });
    expect(passivePreferenceValues(graph.nodes["15617"])).toEqual({ lifeFlaskRecovery: 20 });
    expect(passivePreferenceValues(graph.nodes["48974"])).toEqual({ manaFlaskRecovery: 25 });
    expect(passivePreferenceValues(graph.nodes["46692"])).toEqual({ flaskChargesGained: 20, charmChargesGained: 20 });
    expect(passivePreferenceValues(graph.nodes["9411"])).toEqual({});
    expect(passivePreferenceValues(graph.nodes["517"])).toEqual({});
  });
});
