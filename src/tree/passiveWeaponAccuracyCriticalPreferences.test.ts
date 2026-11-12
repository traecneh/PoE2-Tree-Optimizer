import { attackClosureSpearIds } from "./attackClosureSkills.fixtures";
import { monkPrimaryIds, monkPrimaryAlwaysHitIds } from "./monkPrimarySkills.fixtures";
import { spearPrimaryIds } from "./spearPrimarySkills.fixtures";
import { bowPrimaryHitIds } from "./bowPrimarySkills.fixtures";
import { quarterstaffPrimaryIds } from "./quarterstaffPrimarySkills.fixtures";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";
import { plantBowHitIds } from "./plantBowSkills.fixtures";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const weapons = [
  ["Bows", "bowAccuracy", "bowCriticalDamageBonus", ["lightning-arrow", "ice-shot", "rain-of-arrows", ...plantBowHitIds, ...bowPrimaryHitIds, "escape-shot"]],
  ["Spears", "spearAccuracy", "spearCriticalDamageBonus", ["lightning-spear", "explosive-spear", "rake", ...spearPrimaryIds, ...attackClosureSpearIds]],
  ["Quarterstaves", "quarterstaffAccuracy", "quarterstaffCriticalDamageBonus", ["ice-strike", "tempest-flurry", ...quarterstaffPrimaryIds, ...monkPrimaryIds]],
] as const;

describe("reviewed weapon Accuracy Rating and Critical Damage Bonus", () => {
  it.each(weapons)("admits %s combat modifiers only for explicit reviewed focuses", (wording, accuracyScope, criticalScope, allowed) => {
    for (const scope of [accuracyScope, criticalScope]) {
      expect(skillPreferencePresets.filter((p) => p.passiveStatScopes?.includes(scope)).map((p) => p.id).sort()).toEqual([...allowed].filter(id =>
        !(scope === "spearAccuracy" && ["spear-of-solaris","cull-the-weak"].includes(id)) && !(scope === "quarterstaffAccuracy" && (monkPrimaryAlwaysHitIds as readonly string[]).includes(id))).sort());
    }
    for (const focusSkillId of [...skillPreferencePresets.map((p) => p.id), undefined, "unknown", "Ice Strike", "__proto__"]) {
      const alwaysHits = ["spear-of-solaris","cull-the-weak"].includes(focusSkillId ?? "") || (monkPrimaryAlwaysHitIds as readonly string[]).includes(focusSkillId ?? "");
      const expected = (allowed as readonly string[]).includes(focusSkillId ?? "") ? { ...(alwaysHits ? {} : { accuracy: 12.5 }), criticalDamageBonus: 20 } : {};
      const passive = node(`12.5% increased Accuracy Rating with ${wording}`, `20% increased Critical Damage Bonus with ${wording}`);
      expect(passivePreferenceValues(passive, { focusSkillId }), focusSkillId).toEqual(expected);
      expect(scorePassiveNode(passive, [{ id: "accuracy", weight: 2 }, { id: "criticalDamageBonus", weight: 3 }], { focusSkillId }))
        .toBeCloseTo(Object.keys(expected).length ? alwaysHits ? 6 : 8.5 : 0);
    }
  });
  it.each(weapons)("retains signed %s values, zero and decimals without scoring chance or other stats", (weapon, _accuracy, _critical, allowed) => {
    const context = { focusSkillId: allowed[0] };
    for (const [id, wording] of [["accuracy", "Accuracy Rating"], ["criticalDamageBonus", "Critical Damage Bonus"]] as const) {
      const passive = node(`  12.5%   INCREASED ${wording.toUpperCase()} WITH ${weapon.toUpperCase()}  `, `20% reduced ${wording} with ${weapon}`);
      expect(passivePreferenceValues(passive, context)).toEqual({ [id]: -7.5 });
      expect(scorePassiveNode(passive, [{ id, weight: 3 }], context)).toBeCloseTo(-2.25);
      expect(scorePassiveNode(passive, [], context)).toBe(0);
      expect(scorePassiveNode(passive, [{ id: "attackDamage", weight: 3 }, { id: "criticalChance", weight: 3 },
        { id: "projectileDamage", weight: 3 }, { id: "spellDamage", weight: 3 }], context)).toBe(0);
      expect(passivePreferenceValues(node(`0% increased ${wording} with ${weapon}`), context)).toEqual({ [id]: 0 });
      expect(passivePreferenceValues(node(`10% increased ${wording} with ${weapon}`, `10% reduced ${wording} with ${weapon}`), context)).toEqual({ [id]: 0 });
    }
  });
  it.each(weapons)("rejects conditional, owned, composite, flat, more/less and malformed %s wording", (weapon, _accuracy, _critical, allowed) => {
    for (const wording of ["Accuracy Rating", "Critical Damage Bonus"]) {
      const effect = `${wording} with ${weapon}`;
      for (const line of [`10% increased ${effect} while stationary`, `10% increased ${effect}\nif you've Crit Recently`,
        `10% increased ${effect} per Power Charge`, `10% increased ${effect} and Attack Speed`,
        `Minions have 10% increased ${effect}`, `Companions have 10% increased ${effect}`, `Totems have 10% increased ${effect}`,
        `Hits against you have 10% reduced ${effect}`, `Enemies have 10% reduced ${effect}`,
        `10% more ${effect}`, `10% less ${effect}`, `+10 to ${effect}`, `+10% to ${effect}`,
        `+10% increased ${effect}`, `-10% increased ${effect}`, `1.2.3% increased ${effect}`,
        `NaN% increased ${effect}`, `Infinity% increased ${effect}`]) {
        expect(passivePreferenceValues(node(line), { focusSkillId: allowed[0] }), line).toEqual({});
      }
    }
  });
  it.each(weapons)("adds genuine generic, attack-only and matching %s sources once", (weapon, _accuracy, _critical, allowed) => {
    const other = weapons.find(([wording]) => wording !== weapon)![0];
    const passive = node("10% increased Accuracy Rating", `20% increased Accuracy Rating with ${weapon}`,
      `5% reduced Accuracy Rating with ${weapon}`, `100% increased Accuracy Rating with ${other}`,
      "10% increased Critical Damage Bonus", "30% increased Critical Damage Bonus for Attack Damage",
      `20% increased Critical Damage Bonus with ${weapon}`, `5% reduced Critical Damage Bonus with ${weapon}`,
      `100% increased Critical Damage Bonus with ${other}`, "100% increased Critical Spell Damage Bonus");
    const context = { focusSkillId: allowed[0] };
    expect(passivePreferenceValues(passive, context)).toEqual({ accuracy: 25, criticalDamageBonus: 55 });
    expect(scorePassiveNode(passive, [{ id: "accuracy", weight: 1 }, { id: "criticalDamageBonus", weight: 1 }], context)).toBe(8);
    expect(scorePassiveNode(node(`20% increased Critical Damage Bonus with ${weapon}`), [{ id: "criticalDamageBonus", weight: 1 },
      { id: "criticalChance", weight: 3 }, { id: "attackDamage", weight: 3 }], context)).toBe(2);
    expect(passivePreferenceValues(passive)).toEqual({ accuracy: 10, criticalDamageBonus: 10 });
    expect(passivePreferenceValues(passive, { focusSkillId: "fireball" })).toEqual({ accuracy: 10, criticalDamageBonus: 110 });
    expect(passivePreferenceValues(passive, { ...context, supportGemIds: ["controlled-destruction"] }))
      .toEqual({ accuracy: 25, criticalDamageBonus: 55 });
  });
  it("does not infer aliases, unsupported weapons, class names or weapon-critical chance", () => {
    const passive = node("10% increased Accuracy Rating with Maces", "10% increased Critical Damage Bonus with Maces",
      "10% increased Accuracy Rating with Crossbows", "10% increased Critical Damage Bonus with Crossbows",
      "10% increased Accuracy Rating with Staves", "10% increased Critical Damage Bonus with Staves",
      "10% increased Accuracy Rating with Quarterstaff", "10% increased Critical Damage Bonus with a Bow");
    for (const focusSkillId of ["boneshatter", "rolling-slam", "ice-strike", "monk", "huntress", "ranger"]) {
      expect(passivePreferenceValues(passive, { focusSkillId })).toEqual({});
    }
    expect(passivePreferenceValues(node("10% increased Critical Hit Chance with Bows"), { focusSkillId: "ice-shot" })).toEqual({});
  });
  it("preserves existing manual priorities without automatically selecting either preference", () => {
    const settings = normalizePassiveOptimizationSettings({ mode: "weighted", focusSkillId: "ice-shot", extraPointBudget: 5,
      preferences: [{ id: "accuracy", weight: 2 }, { id: "criticalDamageBonus", weight: 3 }] });
    expect(settings.preferences).toEqual([{ id: "accuracy", weight: 2 }, { id: "criticalDamageBonus", weight: 3 }]);
    for (const preset of skillPreferencePresets) {
      expect(preset.suggestions.some((s) => s.id === "accuracy" || s.id === "criticalDamageBonus")).toBe(false);
      expect(addSkillPresetPreferences(settings, preset).preferences.slice(0, 2)).toEqual(settings.preferences);
    }
  });
  it("covers 11 native occurrences and eight wordings while preserving other real node effects", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const totals = { accuracy: 0, criticalDamageBonus: 0 };
    const wordings = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) {
      for (const line of n.stats) for (const [weapon, , , allowed] of weapons) {
        for (const [id, wording] of [["accuracy", "Accuracy Rating"], ["criticalDamageBonus", "Critical Damage Bonus"]] as const) {
          if (new RegExp(`^\\d+% increased ${wording} with ${weapon}$`, "i").test(line)) {
            expect(passivePreferenceValues(node(line), { focusSkillId: allowed[0] })).toEqual({ [id]: Number(line.match(/^\d+/)![0]) });
            expect(passivePreferenceValues(node(line))).toEqual({});
            totals[id]++;
            wordings.add(line);
          }
        }
      }
    }
    expect(totals).toEqual({ accuracy: 5, criticalDamageBonus: 6 });
    expect(wordings.size).toBe(8);
    expect(passivePreferenceValues(graph.nodes["2113"], { focusSkillId: "ice-strike" }))
      .toEqual({ accuracy: 25, criticalDamageBonus: 25, attributes: 25 });
    expect(passivePreferenceValues(graph.nodes["13895"], { focusSkillId: "lightning-spear" }))
      .toEqual({ accuracy: 25, attackDamage: 25 });
    expect(passivePreferenceValues(graph.nodes["10265"], { focusSkillId: "ice-shot" })).toEqual({});
  });
});
