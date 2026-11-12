import { attackClosureStunIds } from "./attackClosureSkills.fixtures";
import { maceShieldMeleeIds, maceShieldWeaponIds } from "./maceShieldSkills.fixtures";
import { monkPrimaryIds, monkPrimaryMeleeIds, monkPrimaryColdIds } from "./monkPrimarySkills.fixtures";
import { spearPrimaryMeleeIds } from "./spearPrimarySkills.fixtures";
import { quarterstaffPrimaryIds, quarterstaffMeleeIds } from "./quarterstaffPrimarySkills.fixtures";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";
import { remainingMeleeIds } from "./remainingAttackSkills.fixtures";
import { macePrimaryIds } from "./macePrimarySkills.fixtures";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const cases = [
  ["stunBuildup", "Stun Buildup with Melee Damage", "meleeStunBuildup", ["ice-strike", "tempest-flurry", "boneshatter", "rolling-slam", "rake", "maul", "shred", ...remainingMeleeIds, ...macePrimaryIds, ...quarterstaffMeleeIds, ...spearPrimaryMeleeIds, ...monkPrimaryMeleeIds, ...maceShieldMeleeIds, ...attackClosureStunIds, "shockwave-totem"], 3],
  ["stunBuildup", "Stun Buildup with Quarterstaves", "quarterstaffStunBuildup", ["ice-strike", "tempest-flurry", ...quarterstaffPrimaryIds, ...monkPrimaryIds], 3],
  ["stunBuildup", "Stun Buildup with Maces", "maceStunBuildup", ["boneshatter", "rolling-slam", ...macePrimaryIds, ...maceShieldWeaponIds], 2],
  ["freezeBuildup", "Freeze Buildup with Quarterstaves", "quarterstaffFreezeBuildup", ["ice-strike", ...monkPrimaryColdIds], 3],
] as const;

describe("reviewed melee and weapon buildup preferences", () => {
  it.each(cases)("admits %s from %s only for the explicit reviewed component allowlist", (id, wording, scope, allowed) => {
    expect(skillPreferencePresets.filter((p) => p.passiveStatScopes?.includes(scope)).map((p) => p.id).sort()).toEqual([...allowed].sort());
    for (const focusSkillId of [...skillPreferencePresets.map((p) => p.id), undefined, "unknown", "Ice Strike", "__proto__"]) {
      const expected = (allowed as readonly string[]).includes(focusSkillId ?? "") ? { [id]: 12.5 } : {};
      expect(passivePreferenceValues(node(`12.5% increased ${wording}`), { focusSkillId }), focusSkillId).toEqual(expected);
      expect(scorePassiveNode(node(`12.5% increased ${wording}`), [{ id, weight: 2 }], { focusSkillId }))
        .toBeCloseTo(Object.keys(expected).length ? 2.5 : 0);
    }
  });
  it.each(cases)("retains signed %s arithmetic for %s without damage, threshold, chance or duration fanout", (id, wording, _scope, allowed) => {
    const context = { focusSkillId: allowed[0] };
    const passive = node(`  12.5%   INCREASED ${wording.toUpperCase()}  `, `20% reduced ${wording}`);
    expect(passivePreferenceValues(passive, context)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 3 }], context)).toBeCloseTo(-2.25);
    expect(scorePassiveNode(passive, [], context)).toBe(0);
    expect(scorePassiveNode(passive, (["attackDamage", "coldDamage", "stunThreshold", "stunRecovery", "freezeThreshold", "freezeDuration",
      "immobilisationBuildup", "ailmentChance"] as const).map((id) => ({ id, weight: 3 })), context)).toBe(0);
    expect(passivePreferenceValues(node(`0% increased ${wording}`), context)).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`10% increased ${wording}`, `10% reduced ${wording}`), context)).toEqual({ [id]: 0 });
  });
  it.each(cases)("rejects conditional, owned, composite, more/less and malformed %s from %s", (_id, wording, _scope, allowed) => {
    for (const line of [`10% increased ${wording} while stationary`, `10% increased ${wording}\nif you've Stunned Recently`,
      `10% increased ${wording} per Power Charge`, `10% increased ${wording} with Critical Hits`,
      `10% increased ${wording} and Damage`, `Minions have 10% increased ${wording}`, `Companions have 10% increased ${wording}`,
      `Totems have 10% increased ${wording}`, `Enemies have 10% reduced ${wording}`, `10% more ${wording}`, `10% less ${wording}`,
      `+10% to ${wording}`, `+10% increased ${wording}`, `-10% increased ${wording}`, `1.2.3% increased ${wording}`,
      `NaN% increased ${wording}`, `Infinity% increased ${wording}`]) {
      expect(passivePreferenceValues(node(line), { focusSkillId: allowed[0] }), line).toEqual({});
    }
  });
  it("adds distinct generic, melee and matching weapon sources once, keeping immobilisation separate", () => {
    const passive = node("10% increased Stun Buildup", "20% increased Stun Buildup with Melee Damage",
      "30% increased Stun Buildup with Quarterstaves", "5% reduced Stun Buildup with Quarterstaves", "40% increased Stun Buildup with Maces",
      "10% increased Freeze Buildup", "20% increased Freeze Buildup with Quarterstaves", "5% reduced Freeze Buildup with Quarterstaves",
      "7% increased Immobilisation buildup");
    expect(passivePreferenceValues(passive, { focusSkillId: "ice-strike" })).toEqual({ stunBuildup: 55, freezeBuildup: 25, immobilisationBuildup: 7 });
    expect(passivePreferenceValues(passive, { focusSkillId: "rolling-slam" })).toEqual({ stunBuildup: 70, freezeBuildup: 10, immobilisationBuildup: 7 });
    expect(passivePreferenceValues(passive, { focusSkillId: "tempest-flurry" })).toEqual({ stunBuildup: 55, freezeBuildup: 10, immobilisationBuildup: 7 });
    expect(passivePreferenceValues(passive)).toEqual({ stunBuildup: 10, freezeBuildup: 10, immobilisationBuildup: 7 });
    expect(scorePassiveNode(node("20% increased Stun Buildup with Melee Damage"), [{ id: "stunBuildup", weight: 1 },
      { id: "immobilisationBuildup", weight: 3 }, { id: "attackDamage", weight: 3 }], { focusSkillId: "ice-strike" })).toBe(2);
  });
  it("does not infer freeze-capable cold hits or unsupported weapon/application/conversion mechanics", () => {
    const passive = { ...node("20% increased Freeze Buildup with Quarterstaves"), name: "Ice Strike Cold Freeze Buildup" };
    for (const focusSkillId of ["tempest-flurry", "boneshatter", "rolling-slam", "frostbolt", "skeletal-frost-mage", "monk", undefined]) {
      expect(passivePreferenceValues(passive, { focusSkillId })).toEqual({});
    }
    const unsupported = node("20% increased Stun Buildup with Spears", "20% increased Stun Buildup with Bows",
      "20% increased Freeze Buildup with Maces", "20% increased Freeze Buildup with Empowered Attacks",
      "20% increased Stun Buildup with Staves", "20% increased Freeze Buildup with Quarterstaff",
      "Your Heavy Stun buildup empties 50% faster", "Modifiers to Stun Buildup apply to Freeze Buildup instead for Glacial Cascade");
    for (const focusSkillId of ["ice-strike", "tempest-flurry", "boneshatter", "rolling-slam"]) {
      expect(passivePreferenceValues(unsupported, { focusSkillId })).toEqual({});
    }
    expect(passivePreferenceValues(passive, { focusSkillId: "ice-strike", supportGemIds: ["brutality-i"] })).toEqual({ freezeBuildup: 20 });
  });
  it("keeps buildup optional and preserves existing manual priorities without new automatic suggestions", () => {
    const settings = normalizePassiveOptimizationSettings({ mode: "weighted", focusSkillId: "ice-strike", extraPointBudget: 5,
      preferences: [{ id: "stunBuildup", weight: 2 }, { id: "freezeBuildup", weight: 3 }] });
    expect(settings.preferences).toEqual([{ id: "stunBuildup", weight: 2 }, { id: "freezeBuildup", weight: 3 }]);
    for (const preset of skillPreferencePresets) {
      expect(preset.suggestions.some((s) => s.id === "stunBuildup" || s.id === "freezeBuildup")).toBe(preset.id === "flash-grenade");
      expect(addSkillPresetPreferences(settings, preset).preferences.slice(0, 2)).toEqual(settings.preferences);
    }
  });
  it("covers eleven native occurrences and eight wordings, preserving independent Daze, damage and attributes", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const wordings = new Set<string>();
    let occurrences = 0;
    for (const [id, wording, , allowed, expected] of cases) {
      let count = 0;
      for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) {
        for (const line of n.stats) if (new RegExp(`^\\d+% increased ${wording}$`, "i").test(line)) {
          expect(passivePreferenceValues(node(line), { focusSkillId: allowed[0] })).toEqual({ [id]: Number(line.match(/^\d+/)![0]) });
          expect(passivePreferenceValues(node(line))).toEqual({});
          wordings.add(line); count++;
        }
      }
      expect(count).toBe(expected); occurrences += count;
    }
    expect(occurrences).toBe(11);
    expect(wordings.size).toBe(8);
    expect(passivePreferenceValues(graph.nodes["34316"], { focusSkillId: "ice-strike" })).toEqual({ stunBuildup: 30, freezeBuildup: 30, dazeChance: 10 });
    expect(passivePreferenceValues(graph.nodes["34316"], { focusSkillId: "tempest-flurry" })).toEqual({ stunBuildup: 30, dazeChance: 10 });
    expect(passivePreferenceValues(graph.nodes["41512"], { focusSkillId: "rolling-slam" })).toEqual({ attackDamage: 15, attributes: 15, stunBuildup: 15 });
    expect(passivePreferenceValues(graph.nodes["20008"], { focusSkillId: "rolling-slam" })).toEqual({ stunBuildup: 30 });
    expect(passivePreferenceValues(graph.nodes["2361"], { focusSkillId: "ice-strike" })).toEqual({ stunBuildup: 20, knockbackDistance: 20 });
  });
});
