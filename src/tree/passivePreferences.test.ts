import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import type { TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "node", stats, flags: {}, position: { x: 0, y: 0 } });

describe("passive preferences", () => {
  it.each([
    ["8483", "Ruin", ["Spell Skills have 10% reduced Area of Effect", "35% increased Spell Area Damage"], 35, -10],
    ["10029", "Repulsion", ["20% increased Spell Area Damage", "Area Skills have 20% chance to Knock Enemies Back on Hit"], 20, undefined],
    ...["11788", "14355", "17107", "19277", "44783"].map((id) => [id, "Spell Area Damage", ["10% increased Spell Area Damage"], 10, undefined] as const),
    ["60269", "Roil", ["Spell Skills have 25% increased Area of Effect", "10% reduced Spell Area Damage"], -10, 25],
  ] as const)("recognizes native Spell Area Damage on %s %s separately from coverage and other damage", (id, name, stats, damage, area) => {
    const passive = { ...node(...stats), id, name };
    const context = { focusSkillId: "fireball" };
    expect(passivePreferenceValues(passive, context)).toEqual({ spellAreaDamage: damage, ...(area === undefined ? {} : { areaOfEffect: area }) });
    expect(scorePassiveNode(passive, [{ id: "spellAreaDamage", weight: 1 }], context)).toBeCloseTo(damage / 10);
    expect(scorePassiveNode(passive, [{ id: "spellAreaDamage", weight: 3 }], context)).toBeCloseTo(damage / 10 * 3);
    expect(scorePassiveNode(passive, [{ id: "spellDamage", weight: 3 }, { id: "fireDamage", weight: 3 }, { id: "projectileDamage", weight: 3 }], context)).toBe(0);
    expect(scorePassiveNode(passive, [], context)).toBe(0);
  });
  it.each([undefined, "unknown", "Fireball", "spark", "essence-drain", "enfeeble", "skeletal-arsonist", "lightning-arrow", "ice-shot",
    "rain-of-arrows", "lightning-spear", "explosive-spear", "ice-strike", "tempest-flurry", "boneshatter", "rolling-slam"])
    ("does not infer spell-area damage scope for %s", (focusSkillId) => {
      const passive = { ...node("35% increased Spell Area Damage"), name: "Fireball Spell Area Damage" };
      expect(passivePreferenceValues(passive, { focusSkillId })).toEqual({});
      expect(scorePassiveNode(passive, [{ id: "spellAreaDamage", weight: 3 }], { focusSkillId })).toBe(0);
    });
  it("keeps Spell Area Damage arithmetic, unrelated damage and support priorities independent", () => {
    const context = { focusSkillId: "fireball", supportGemIds: ["controlled-destruction", "projectile-acceleration-iii"] };
    const passive = node("10% increased Spell Damage", "35% increased Spell Area Damage", "10% reduced Spell Area Damage",
      "  2.5%   increased Spell Area Damage  ", "20% increased Fire Damage", "10% increased Area of Effect");
    expect(passivePreferenceValues(passive, context)).toEqual({ spellDamage: 10, spellAreaDamage: 27.5, fireDamage: 20, areaOfEffect: 10 });
    expect(scorePassiveNode(passive, [{ id: "spellAreaDamage", weight: 2 }], context)).toBeCloseTo(5.5);
    expect(scorePassiveNode(passive, [{ id: "spellDamage", weight: 1 }, { id: "spellAreaDamage", weight: 2 }], context)).toBeCloseTo(6.5);
    expect(passivePreferenceValues(node("10% increased Spell Area Damage", "10% reduced Spell Area Damage"), context)).toEqual({ spellAreaDamage: 0 });
    expect(passivePreferenceValues(node("0% increased Spell Area Damage"), context)).toEqual({ spellAreaDamage: 0 });
  });
  it("does not promote conditional, generic-area, minion or ailment modifiers into Spell Area Damage", () => {
    expect(passivePreferenceValues(node(
      "10% increased Spell Area Damage while stationary", "10% increased Spell Area Damage\nif you've Cast Recently",
      "10% increased Spell Area Damage per Power Charge", "Minions deal 10% increased Spell Area Damage",
      "Minions have 10% increased Spell Area Damage", "Echoed Spells deal 10% increased Spell Area Damage",
      "10% more Spell Area Damage", "10% less Spell Area Damage", "-10% increased Spell Area Damage", "+10% increased Spell Area Damage",
      "..% increased Spell Area Damage", "NaN% increased Spell Area Damage", "Infinity% increased Spell Area Damage",
      "10% increased Area Damage", "10% increased Attack Area Damage", "10% increased Spell Area Damage with Ailments",
      "10% increased Spell Area Damage and Area of Effect", "Spell Skills have 10% increased Area Damage",
    ), { focusSkillId: "fireball" })).toEqual({ areaDamage: 10 });
  });
  it.each([
    ["8483", "Ruin", ["Spell Skills have 10% reduced Area of Effect", "35% increased Spell Area Damage"], -10, 35],
    ["8660", "Reverberation", ["Spell Skills have 15% increased Area of Effect"], 15, undefined],
    ...["17711", "18846", "22949", "33180", "35171", "46989", "52615"].map((id) => [id, "Spell Area of Effect", ["Spell Skills have 6% increased Area of Effect"], 6, undefined] as const),
    ["60269", "Roil", ["Spell Skills have 25% increased Area of Effect", "10% reduced Spell Area Damage"], 25, -10],
  ] as const)("matches the native spell-area wording on %s %s without inventing general damage scores", (id, name, stats, area, damage) => {
    const passive = { ...node(...stats), id, name };
    expect(passivePreferenceValues(passive, { focusSkillId: "fireball" })).toEqual({ areaOfEffect: area, ...(damage === undefined ? {} : { spellAreaDamage: damage }) });
    expect(scorePassiveNode(passive, [{ id: "areaOfEffect", weight: 3 }], { focusSkillId: "fireball" })).toBeCloseTo(area / 10 * 3);
    expect(scorePassiveNode(passive, [{ id: "spellDamage", weight: 3 }, { id: "fireDamage", weight: 3 }, { id: "projectileDamage", weight: 3 }], { focusSkillId: "fireball" })).toBe(0);
  });
  it.each([undefined, "unknown", "Fireball", "spark", "essence-drain", "enfeeble", "skeletal-arsonist", "lightning-arrow", "ice-shot",
    "rain-of-arrows", "lightning-spear", "explosive-spear", "ice-strike", "tempest-flurry", "boneshatter", "rolling-slam"])
    ("does not infer spell-area scope from names or tags for %s", (focusSkillId) => {
      expect(passivePreferenceValues({ ...node("Spell Skills have 25% increased Area of Effect"), name: "Fireball Spell Area of Effect" }, { focusSkillId })).toEqual({});
    });
  it("adds generic and spell-area coverage once, preserving reductions, decimals and support scope", () => {
    const passive = node("10% increased Area of Effect", "Spell Skills have 6% increased Area of Effect", "Spell Skills have 10% reduced Area of Effect",
      "  Spell Skills have 2.5%   increased Area of Effect  ", "100% increased Area of Effect for Attacks");
    const context = { focusSkillId: "fireball", supportGemIds: ["controlled-destruction"] };
    expect(passivePreferenceValues(passive, context)).toEqual({ areaOfEffect: 8.5 });
    expect(passivePreferenceValues(passive)).toEqual({ areaOfEffect: 10 });
    expect(scorePassiveNode(passive, [], context)).toBe(0);
    expect(scorePassiveNode(passive, [{ id: "areaOfEffect", weight: 2 }], context)).toBeCloseTo(1.7);
    expect(passivePreferenceValues(node("Spell Skills have 6% increased Area of Effect", "Spell Skills have 6% reduced Area of Effect"), context)).toEqual({ areaOfEffect: 0 });
    expect(passivePreferenceValues(node("Spell Skills have 0% increased Area of Effect"), context)).toEqual({ areaOfEffect: 0 });
  });
  it("excludes Echoed, conditional, minion-owned and malformed spell-area effects", () => {
    expect(passivePreferenceValues(node(
      "Echoed Spells have 25% increased Area of Effect", "Spell Skills have 25% increased Area of Effect while stationary",
      "Spell Skills have 25% increased Area of Effect\nif you've Cast Recently", "Spell Skills have 5% increased Area of Effect per Power Charge",
      "Minions' Spell Skills have 25% increased Area of Effect", "Minions have 25% increased Area of Effect",
      "Spell Skills have 25% more Area of Effect", "Spell Skills have 25% less Area of Effect", "Spell Skills have ..% increased Area of Effect",
      "Spell Skills have NaN% increased Area of Effect", "Spell Skills have -5% increased Area of Effect", "Spell Skills have Infinity% increased Area of Effect",
      "25% increased Area Damage",
      "Spell Skills have 25% increased Area of Effect and Damage", "Spell Skills have +25% increased Area of Effect",
    ), { focusSkillId: "fireball" })).toEqual({ minionAreaOfEffect: 25, areaDamage: 25 });
    expect(scorePassiveNode(node("Minions have 25% increased Area of Effect"), [{ id: "areaOfEffect", weight: 3 }], { focusSkillId: "fireball" })).toBe(0);
  });
  it.each([["ice-strike", "Quarterstaves", "Spears"], ["tempest-flurry", "Quarterstaves", "Spears"],
    ["lightning-spear", "Spears", "Quarterstaves"], ["explosive-spear", "Spears", "Quarterstaves"]])
    ("counts only matching weapon critical chance for %s, and scores it only when selected", (focusSkillId, weapon, otherWeapon) => {
      const passive = node(`10% increased Critical Hit Chance with ${weapon}`, `100% increased Critical Hit Chance with ${otherWeapon}`);
      expect(passivePreferenceValues(passive, { focusSkillId })).toEqual({ criticalChance: 10 });
      expect(scorePassiveNode(passive, [], { focusSkillId })).toBe(0);
      expect(scorePassiveNode(passive, [{ id: "attackDamage", weight: 3 }, { id: "energyShield", weight: 3 }], { focusSkillId })).toBe(0);
      expect(scorePassiveNode(passive, [{ id: "criticalChance", weight: 3 }], { focusSkillId })).toBe(2);
      expect(passivePreferenceValues(passive, { focusSkillId, supportGemIds: ["rapid-attacks-ii"] })).toEqual({ criticalChance: 10 });
    });
  it.each([undefined, "unknown", "Ice Strike", "spark", "fireball", "essence-drain", "enfeeble", "skeletal-arsonist", "lightning-arrow", "ice-shot", "rain-of-arrows", "boneshatter", "rolling-slam"])
    ("does not infer quarterstaff/spear critical chance for %s", (focusSkillId) => {
      expect(passivePreferenceValues(node("10% increased Critical Hit Chance with Quarterstaves", "10% increased Critical Hit Chance with Spears"), { focusSkillId })).toEqual({});
    });
  it.each([["ice-strike", "Quarterstaves"], ["lightning-spear", "Spears"]])("adds generic, attack and weapon critical values once for %s, retaining reductions", (focusSkillId, weapon) => {
    const passive = node("15% increased Critical Hit Chance", "30% increased Critical Hit Chance for Attacks",
      `10% increased Critical Hit Chance with ${weapon}`, `5% reduced Critical Hit Chance with ${weapon}`, "90% increased Critical Hit Chance for Spells");
    expect(passivePreferenceValues(passive, { focusSkillId })).toEqual({ criticalChance: 50 });
    expect(scorePassiveNode(passive, [{ id: "criticalChance", weight: 3 }], { focusSkillId })).toBe(10);
    expect(passivePreferenceValues(passive)).toEqual({ criticalChance: 15 });
    expect(passivePreferenceValues(node(`  2.5%   increased Critical Hit Chance with ${weapon}  `, `3% reduced Critical Hit Chance with ${weapon}`), { focusSkillId }))
      .toEqual({ criticalChance: -0.5 });
    expect(passivePreferenceValues(node(`10% increased Critical Hit Chance with ${weapon}`, `10% reduced Critical Hit Chance with ${weapon}`), { focusSkillId }))
      .toEqual({ criticalChance: 0 });
  });
  it.each([["ice-strike", 25], ["tempest-flurry", 25], ["lightning-spear", 40], ["explosive-spear", 40]] as const)
    ("keeps critical damage, base overrides, conditional and unsupported weapon modifiers out of %s critical chance", (focusSkillId, criticalDamageBonus) => {
    const mixed = node("10% increased Critical Hit Chance with Spears if you've Crit Recently", "10% increased Critical Hit Chance with Quarterstaves\nwhile stationary",
      "Minions have 10% increased Critical Hit Chance with Spears", "Minions have 10% increased Critical Hit Chance with Quarterstaves",
      "10% more Critical Hit Chance with Spears", "10% less Critical Hit Chance with Quarterstaves", "..% increased Critical Hit Chance with Spears",
      "Base Critical Hit Chance with Quarterstaves is 10%", "+1% to Critical Hit Chance with Spears", "Critical Hit Chance with Spears is Lucky",
      "25% increased Critical Damage Bonus with Quarterstaves", "40% increased Critical Damage Bonus with Spears",
      "10% increased Critical Hit Chance with Crossbows", "10% increased Critical Hit Chance with Bows", "10% increased Critical Hit Chance with Maces",
      "10% increased Critical Hit Chance with Staves", "10% increased Critical Hit Chance with Quarterstaff", "10% increased Critical Hit Chance with Spears and Quarterstaves",
      "10% increased Critical Strike Chance with Spears", "-5% increased Critical Hit Chance with Spears", "NaN% increased Critical Hit Chance with Quarterstaves");
    expect(passivePreferenceValues(mixed, { focusSkillId })).toEqual({ criticalDamageBonus });
    expect(scorePassiveNode(mixed, [{ id: "criticalChance", weight: 3 }], { focusSkillId })).toBe(0);
  });
  it.each([
    ["326", "Quarterstaff Critical Chance", "10% increased Critical Hit Chance with Quarterstaves", "ice-strike"],
    ["31449", "Quarterstaff Critical Chance", "10% increased Critical Hit Chance with Quarterstaves", "tempest-flurry"],
    ["18910", "Spear Critical Chance", "10% increased Critical Hit Chance with Spears", "lightning-spear"],
    ["38369", "Spear Critical Chance", "10% increased Critical Hit Chance with Spears", "explosive-spear"],
  ])("recognizes current weapon-critical wording on %s %s", (id, name, stat, focusSkillId) => {
    const passive = { ...node(stat), id, name };
    expect(passivePreferenceValues(passive, { focusSkillId })).toEqual({ criticalChance: 10 });
    expect(scorePassiveNode(passive, [{ id: "criticalChance", weight: 1 }], { focusSkillId })).toBeCloseTo(2 / 3);
  });
  it.each(["ice-strike", "tempest-flurry", "boneshatter", "rolling-slam"])("scores unconditional Melee Damage once as Attack Damage for %s", (focusSkillId) => {
    const passive = node("10% increased Melee Damage");
    expect(passivePreferenceValues(passive, { focusSkillId })).toEqual({ attackDamage: 10 });
    expect(scorePassiveNode(passive, [{ id: "attackDamage", weight: 3 }, { id: "physicalDamage", weight: 3 },
      { id: "coldDamage", weight: 3 }, { id: "elementalDamage", weight: 3 }, { id: "projectileDamage", weight: 3 }], { focusSkillId })).toBe(3);
    expect(passivePreferenceValues(passive, { focusSkillId, supportGemIds: ["rapid-attacks-ii", "concentrated-area"] })).toEqual({ attackDamage: 10 });
  });
  it.each([undefined, "unknown", "Ice Strike", "spark", "fireball", "enfeeble", "essence-drain", "skeletal-arsonist",
    "lightning-arrow", "ice-shot", "rain-of-arrows", "lightning-spear", "explosive-spear"])("does not infer Melee Damage scope for %s", (focusSkillId) => {
    expect(passivePreferenceValues({ ...node("20% increased Melee Damage"), name: "Melee Damage" }, { focusSkillId })).toEqual({});
  });
  it.each([["ice-strike", "Quarterstaves"], ["tempest-flurry", "Quarterstaves"], ["boneshatter", "Maces"], ["rolling-slam", "Maces"]])
    ("adds general, melee and matching weapon damage once for %s, retaining reductions", (focusSkillId, weapon) => {
      const passive = node("10% increased Attack Damage", "20% increased Melee Damage", "5% reduced Melee Damage",
        `14% increased Damage with ${weapon}`, "12% increased Physical Damage");
      expect(passivePreferenceValues(passive, { focusSkillId })).toEqual({ attackDamage: 39, physicalDamage: 12 });
      expect(passivePreferenceValues(passive)).toEqual({ attackDamage: 10, physicalDamage: 12 });
      expect(scorePassiveNode(passive, [{ id: "attackDamage", weight: 1 }], { focusSkillId })).toBeCloseTo(3.9);
      expect(passivePreferenceValues(node("5% increased Melee Damage", "5% reduced Melee Damage"), { focusSkillId })).toEqual({ attackDamage: 0 });
      expect(passivePreferenceValues(node("  2.5%   increased Melee Damage  ", "3% reduced Melee Damage"), { focusSkillId })).toEqual({ attackDamage: -0.5 });
    });
  it.each(["ice-strike", "tempest-flurry", "boneshatter", "rolling-slam"])("rejects conditional, typed, minion and special Melee Damage wording for %s", (focusSkillId) => {
    expect(passivePreferenceValues(node(
      "15% increased Melee Damage with Hits at Close Range", "75% increased Melee Damage with Spears while Surrounded",
      "15% increased Melee Damage if you've dealt a Projectile Attack Hit in the past eight seconds",
      "20% increased Melee Damage against Heavy Stunned enemies", "30% increased Melee Damage when on Full Life",
      "50% increased Melee Damage against Immobilised Enemies", "10% increased Melee Damage\nwhile stationary",
      "Minions deal 10% increased Melee Damage", "Minions have 10% increased Melee Damage",
      "10% more Melee Damage", "10% less Melee Damage", "..% increased Melee Damage", "-5% increased Melee Damage",
      "NaN% increased Melee Damage", "Infinity% increased Melee Damage", "10% increased Melee Physical Damage",
      "10% increased Physical Melee Damage", "10% increased Attack and Melee Damage", "30% increased Stun Buildup with Melee Damage",
    ), { focusSkillId })).toEqual({ stunBuildup: 30 });
  });
  it.each([
    ["5710", "Brutal", "16% increased Melee Damage", 16],
    ["17372", "Reaching Strike", "25% increased Melee Damage", 25],
    ["15427", "Melee Damage", "12% increased Melee Damage", 12],
    ["41512", "Heavy Weaponry", "15% increased Melee Damage", 15],
    ["45363", "Smash", "20% increased Melee Damage", 20],
    ["33556", "Melee Damage", "8% increased Melee Damage", 8],
  ] as const)("recognizes current tree Melee Damage wording on %s %s", (id, name, stat, expected) => {
    expect(passivePreferenceValues({ ...node(stat), id, name }, { focusSkillId: "boneshatter" })).toEqual({ attackDamage: expected });
  });
  it("scores Smash's unconditional bonus without assuming its Heavy Stun conditional", () => {
    const passive = { ...node("20% increased Melee Damage", "40% increased Melee Damage against Heavy Stunned enemies"), id: "45363", name: "Smash" };
    expect(passivePreferenceValues(passive, { focusSkillId: "rolling-slam" })).toEqual({ attackDamage: 20 });
    expect(scorePassiveNode(passive, [{ id: "attackDamage", weight: 3 }], { focusSkillId: "rolling-slam" })).toBe(6);
  });
  it.each([
    ["lightning-arrow", "Bows"], ["ice-shot", "Bows"], ["rain-of-arrows", "Bows"],
    ["lightning-spear", "Spears"], ["explosive-spear", "Spears"],
    ["ice-strike", "Quarterstaves"], ["tempest-flurry", "Quarterstaves"], ["boneshatter", "Maces"], ["rolling-slam", "Maces"],
  ])("adds only the reviewed weapon's damage and speed for %s", (focusSkillId, weapon) => {
    const passive = node(`12% increased Damage with ${weapon}`, `3% increased Attack Speed with ${weapon}`,
      ...["Bows", "Spears", "Quarterstaves", "Maces", "Crossbows", "Staves"].filter((other) => other !== weapon)
        .flatMap((other) => [`90% increased Damage with ${other}`, `90% increased Attack Speed with ${other}`]));
    expect(passivePreferenceValues(passive, { focusSkillId })).toEqual({ attackDamage: 12, attackSpeed: 3 });
    expect(scorePassiveNode(passive, [{ id: "attackDamage", weight: 3 }, { id: "attackSpeed", weight: 2 }], { focusSkillId })).toBeCloseTo(5.6);
    expect(scorePassiveNode(passive, [{ id: "physicalDamage", weight: 3 }, { id: "projectileDamage", weight: 3 }], { focusSkillId })).toBe(0);
  });
  it.each([undefined, "unknown", "Ice Shot", "spark", "fireball", "enfeeble", "essence-drain", "skeletal-arsonist", "ice-strike", "tempest-flurry", "boneshatter", "rolling-slam"])
    ("does not infer bow/spear modifiers for focus %s", (focusSkillId) => {
      expect(passivePreferenceValues(node("12% increased Damage with Bows", "3% increased Attack Speed with Bows",
        "25% increased Damage with Spears", "10% increased Attack Speed with Spears"), { focusSkillId })).toEqual({});
    });
  it.each([["lightning-arrow", "Bows"], ["lightning-spear", "Spears"], ["ice-strike", "Quarterstaves"], ["boneshatter", "Maces"]])("adds general and weapon-only lines once for %s, including reductions", (focusSkillId, weapon) => {
    const passive = node("10% increased Attack Damage", "3% increased Attack and Cast Speed", `12% increased Damage with ${weapon}`,
      `2% reduced Damage with ${weapon}`, `5% increased Attack Speed with ${weapon}`, `2% reduced Attack Speed with ${weapon}`);
    expect(passivePreferenceValues(passive, { focusSkillId })).toEqual({ attackDamage: 20, attackSpeed: 6, castSpeed: 3 });
    expect(passivePreferenceValues(passive)).toEqual({ attackDamage: 10, attackSpeed: 3, castSpeed: 3 });
    expect(scorePassiveNode(passive, [{ id: "attackDamage", weight: 1 }, { id: "attackSpeed", weight: 1 }], { focusSkillId })).toBe(4);
    expect(passivePreferenceValues(node(`5% increased Damage with ${weapon}`, `5% reduced Damage with ${weapon}`, `3% reduced Attack Speed with ${weapon}`), { focusSkillId }))
      .toEqual({ attackDamage: 0, attackSpeed: -3 });
    expect(passivePreferenceValues(node(`  2.5%   increased Damage with ${weapon}  `, `0.5% reduced Attack Speed with ${weapon}`), { focusSkillId }))
      .toEqual({ attackDamage: 2.5, attackSpeed: -0.5 });
  });
  it.each(["lightning-arrow", "lightning-spear", "ice-strike", "boneshatter"])("keeps conditional, special, malformed and unrelated weapon wording out of %s damage/speed", (focusSkillId) => {
    const invalid = node("12% increased Damage with Bows if you've Crit Recently", "3% increased Attack Speed with Spears\nwhile stationary",
      "Minions deal 12% increased Damage with Bows", "Minions have 3% increased Attack Speed with Spears",
      "12% more Damage with Bows", "3% less Attack Speed with Spears", "..% increased Damage with Bows",
      "NaN% increased Attack Speed with Spears", "Infinity% increased Damage with Bows", "-5% increased Damage with Spears",
      "3% increased Attack and Cast Speed with Bows", "10% increased Damage with Bows and Spears",
      "20% increased Physical Damage with Bows", "Base Critical Hit Chance with Spears is 10%",
      "75% increased Melee Damage with Spears while Surrounded", "40% increased Projectile Damage with Spears while there are no Enemies within 3m",
      "Increases and Reductions to Projectile Speed also apply to Damage with Bows", "Bow Attacks have Culling Strike",
      "3% increased Attack Speed with Crossbows", "12% increased Damage with Crossbows",
      "12% increased Damage with Quarterstaves while stationary", "3% increased Attack Speed with Maces\nif you've Stunned Recently",
      "Minions deal 12% increased Damage with Maces", "Minions have 3% increased Attack Speed with Quarterstaves",
      "12% more Damage with Maces", "3% less Attack Speed with Quarterstaves", "..% increased Damage with Maces",
      "3% increased Attack and Cast Speed with Quarterstaves", "12% increased Damage with Maces and Quarterstaves",
      "10% increased Damage with Staves", "3% increased Attack Speed with Staves",
      "Base Critical Hit Chance with Quarterstaves is 10%", "18% increased Stun Buildup with Maces",
      "20% more Damage against Heavy Stunned Enemies with Maces", "8% chance for Mace Slam Skills you use yourself to cause an additional Aftershock",
      "Strike Skills you use yourself with Maces have 10% chance to deal Splash Damage",
      "30% increased Armour, Evasion and Energy Shield while wielding a Quarterstaff",
      "Quarterstaff Skills that consume Power Charges count as consuming an additional Power Charge");
    expect(passivePreferenceValues({ ...invalid, name: "Bow Damage and Spear Attack Speed" }, { focusSkillId }))
      .toEqual(focusSkillId === "boneshatter" ? { stunBuildup: 18 } : {});
    expect(scorePassiveNode(invalid, [{ id: "attackDamage", weight: 3 }, { id: "attackSpeed", weight: 3 }], { focusSkillId })).toBe(0);
  });
  it.each([
    ["8573", "Bow Damage", "12% increased Damage with Bows", "lightning-arrow", { attackDamage: 12 }],
    ["21112", "Bow Damage", "10% increased Damage with Bows", "ice-shot", { attackDamage: 10 }],
    ["21218", "Bow Damage", "16% increased Damage with Bows", "rain-of-arrows", { attackDamage: 16 }],
    ["7066", "Bow Attack Speed", "5% increased Attack Speed with Bows", "ice-shot", { attackSpeed: 5 }],
    ["18969", "Bow Speed", "3% increased Attack Speed with Bows", "lightning-arrow", { attackSpeed: 3 }],
    ["9240", "Spear Damage", "10% increased Damage with Spears", "lightning-spear", { attackDamage: 10 }],
    ["13895", "Precise Point", "25% increased Damage with Spears", "explosive-spear", { attackDamage: 25 }],
    ["19767", "Spear Attack Speed", "3% increased Attack Speed with Spears", "lightning-spear", { attackSpeed: 3 }],
    ["4536", "Quarterstaff Speed", "3% increased Attack Speed with Quarterstaves", "ice-strike", { attackSpeed: 3 }],
    ["11598", "Quarterstaff Speed", "3% increased Attack Speed with Quarterstaves", "tempest-flurry", { attackSpeed: 3 }],
    ["44516", "Quarterstaff Speed", "3% increased Attack Speed with Quarterstaves", "ice-strike", { attackSpeed: 3 }],
    ["37514", "Whirling Assault", "8% increased Attack Speed with Quarterstaves", "tempest-flurry", { attackSpeed: 8 }],
    ["375", "Mace Damage", "15% increased Damage with Maces", "boneshatter", { attackDamage: 15 }],
    ["13937", "Mace Damage", "14% increased Damage with Maces", "rolling-slam", { attackDamage: 14 }],
    ["14693", "Mace Damage", "14% increased Damage with Maces", "boneshatter", { attackDamage: 14 }],
    ["52829", "Mace Damage and Stun Buildup", "10% increased Damage with Maces", "rolling-slam", { attackDamage: 10 }],
  ] as const)("recognizes current-tree wording from %s %s", (id, name, stat, focusSkillId, expected) => {
    expect(passivePreferenceValues({ ...node(stat), id, name }, { focusSkillId })).toEqual(expected);
  });
  it("counts both independent effects on Roll and Strike without copying weapon damage into projectile damage", () => {
    const passive = { ...node("25% increased Damage with Spears", "10% increased Attack Speed with Spears"), id: "61112", name: "Roll and Strike" };
    const context = { focusSkillId: "lightning-spear", supportGemIds: ["rapid-attacks-ii", "projectile-acceleration-iii"] };
    expect(passivePreferenceValues(passive, context)).toEqual({ attackDamage: 25, attackSpeed: 10 });
    expect(scorePassiveNode(passive, [{ id: "attackDamage", weight: 3 }, { id: "attackSpeed", weight: 2 }, { id: "projectileDamage", weight: 2 }], context))
      .toBeCloseTo(7.5 + 20 / 3);
  });
  it.each([undefined, "unknown", "Ice Strike", "spark", "fireball", "enfeeble", "essence-drain", "skeletal-arsonist",
    "lightning-arrow", "ice-shot", "rain-of-arrows", "lightning-spear", "explosive-spear"])("does not infer quarterstaff/mace bonuses for %s", (focusSkillId) => {
    expect(passivePreferenceValues(node("10% increased Damage with Quarterstaves", "3% increased Attack Speed with Quarterstaves",
      "15% increased Damage with Maces", "3% increased Attack Speed with Maces"), { focusSkillId })).toEqual({});
  });
  it("preserves melee weapon matching and manual priorities when supports refine speed and area", () => {
    const passive = node("14% increased Damage with Maces", "3% increased Attack Speed with Maces");
    const context = { focusSkillId: "rolling-slam", supportGemIds: ["heavy-swing", "rapid-attacks-ii", "concentrated-area", "fist-of-war-i"] };
    expect(passivePreferenceValues(passive, context)).toEqual({ attackDamage: 14, attackSpeed: 3 });
    expect(scorePassiveNode(passive, [{ id: "attackDamage", weight: 3 }, { id: "attackSpeed", weight: 1 }], context)).toBeCloseTo(5.2);
  });
  it("scores explicit effects with priorities and consistent normalization", () => {
    expect(scorePassiveNode(node("12% increased maximum Energy Shield", "+5 to any Attribute"), [
      { id: "energyShield", weight: 2 }, { id: "attributes", weight: 1 },
    ])).toBe(3);
    expect(scorePassiveNode(node("+10 to maximum Life", "3% increased maximum Life"), [{ id: "life", weight: 1 }])).toBe(2);
  });
  it("does not mistake minion life, conditionals, conversions, or names for player bonuses", () => {
    expect(passivePreferenceValues(node(
      "Minions have 10% increased maximum Life", "30% increased maximum Energy Shield if you've consumed a Power Charge Recently",
      "Gain 50% of maximum Energy Shield as additional Freeze Threshold", "30% increased Armour and Evasion Rating while stationary",
      "30% increased maximum Energy Shield\nif you've consumed a Power Charge Recently",
    ))).toEqual({ minionLife: 10 });
  });
  it("handles combined explicit effects, negative effects and each attribute once", () => {
    expect(passivePreferenceValues(node("8% increased Attack and Cast Speed"))).toEqual({ attackSpeed: 8, castSpeed: 8 });
    expect(passivePreferenceValues(node("3% increased maximum Life, Mana and Energy Shield", "+10 to Strength and Dexterity", "20% reduced maximum Energy Shield")))
      .toEqual({ life: 3, mana: 3, energyShield: -17, attributes: 20 });
    expect(passivePreferenceValues(node("Minions have 3% increased Attack and Cast Speed", "Minions have 15% reduced Attack Speed")))
      .toEqual({ minionSpeed: -9, minionAttackSpeed: -12, minionCastSpeed: 3 });
  });
  it("scores specific curse effects without confusing incoming curses or conditional bonuses", () => {
    expect(passivePreferenceValues(node(
      "6% increased Curse Magnitudes", "20% increased Curse Duration", "10% increased Area of Effect of Curses", "10% faster Curse Activation",
      "10% reduced effect of Curses on you", "Your Curses have 20% increased Magnitudes if 50% of Curse Duration expired",
    ))).toEqual({ curseMagnitude: 6, curseDuration: 20, curseArea: 10, curseActivation: 10, curseEffectReduction: 10 });
    expect(passivePreferenceValues(node("25% reduced Curse Duration", "10% slower Curse Activation")))
      .toEqual({ curseDuration: -25, curseActivation: -10 });
  });
  it("keeps general area, projectile hit damage, speed, duration and DoT distinct", () => {
    expect(passivePreferenceValues(node(
      "10% increased Area of Effect", "10% increased Projectile Damage", "10% increased Projectile Speed", "10% increased Skill Effect Duration", "10% increased Damage over Time",
      "20% increased Attack Area Damage", "15% increased Projectile Speed for Spell Skills", "Take 50% less Damage over Time if you've started taking Damage over Time in the past second",
    ))).toEqual({ areaOfEffect: 10, projectileDamage: 10, projectileSpeed: 10, skillDuration: 10, damageOverTime: 10 });
  });
  it("scores minion attack and cast speed separately without changing the existing combined preference", () => {
    const minion = node("Minions have 3% increased Attack and Cast Speed", "Minions have 10% increased maximum Life");
    expect(scorePassiveNode(minion, [{ id: "minionAttackSpeed", weight: 1 }])).toBe(1);
    expect(scorePassiveNode(minion, [{ id: "minionCastSpeed", weight: 1 }])).toBe(1);
    expect(scorePassiveNode(minion, [{ id: "minionSpeed", weight: 1 }])).toBe(2);
    expect(scorePassiveNode(minion, [{ id: "attackSpeed", weight: 1 }, { id: "life", weight: 1 }])).toBe(0);
  });
  it.each(["spark", "fireball", "essence-drain"])("counts spell-only projectile speed for the reviewed %s focus", (focusSkillId) => {
    expect(passivePreferenceValues(node("15% increased Projectile Speed for Spell Skills"), { focusSkillId }))
      .toEqual({ projectileSpeed: 15 });
    expect(scorePassiveNode(node("15% increased Projectile Speed for Spell Skills"), [{ id: "projectileSpeed", weight: 3 }], { focusSkillId })).toBe(4.5);
  });
  it.each([undefined, "unknown", "Spark", "lightning-arrow", "enfeeble", "skeletal-arsonist"])("does not apply spell-only speed to focus %s", (focusSkillId) => {
    expect(passivePreferenceValues(node("15% increased Projectile Speed for Spell Skills", "5% increased Projectile Speed"), { focusSkillId }))
      .toEqual({ projectileSpeed: 5 });
  });
  it("adds general and applicable scoped values once, including reductions and zero-net lines", () => {
    const context = { focusSkillId: "spark" };
    expect(passivePreferenceValues(node("5% increased Projectile Speed", "15% increased Projectile Speed for Spell Skills"), context)).toEqual({ projectileSpeed: 20 });
    expect(passivePreferenceValues(node("5% increased Projectile Speed", "10% reduced Projectile Speed for Spell Skills"), context)).toEqual({ projectileSpeed: -5 });
    expect(passivePreferenceValues(node("5% increased Projectile Speed for Spell Skills", "5% reduced Projectile Speed for Spell Skills"), context)).toEqual({ projectileSpeed: 0 });
    expect(scorePassiveNode(node("10% reduced Projectile Speed for Spell Skills"), [{ id: "projectileSpeed", weight: 3 }], context)).toBe(-3);
  });
  it("keeps exact scope and conditional safeguards for spell projectile speed", () => {
    expect(passivePreferenceValues(node(
      "15% increased Projectile Speed for Spell Skills if you've Cast Recently",
      "15% increased Projectile Speed for Spell Skills\nwhile stationary",
      "Minions have 15% increased Projectile Speed for Spell Skills",
      "15% increased Projectile Speed for Attack Skills",
      "15% more Projectile Speed for Spell Skills",
      "..% increased Projectile Speed for Spell Skills",
    ), { focusSkillId: "spark" })).toEqual({});
    expect(passivePreferenceValues(node("  2.5%   increased Projectile Speed for Spell Skills  "), { focusSkillId: "spark" })).toEqual({ projectileSpeed: 2.5 });
  });
  it.each([
    ["Turn the Clock Forward", "20% increased Spell Damage", "15% increased Projectile Speed for Spell Skills", 15],
    ["Spell Damage and Projectile Speed", "8% increased Spell Damage", "8% increased Projectile Speed for Spell Skills", 8],
    ["Turn the Clock Back", "15% increased Spell Damage", "10% reduced Projectile Speed for Spell Skills", -10],
    ["Spell Damage and Projectile Speed", "8% increased Spell Damage", "5% reduced Projectile Speed for Spell Skills", -5],
  ] as const)("recognizes the current-tree wording on %s without dropping its spell damage", (name, damage, speed, expected) => {
    const passive = { ...node(damage, speed), name };
    expect(passivePreferenceValues(passive, { focusSkillId: "spark" })).toMatchObject({ projectileSpeed: expected });
    expect(passivePreferenceValues(passive, { focusSkillId: "spark" }).spellDamage).toBe(passivePreferenceValues(passive).spellDamage);
    expect(passivePreferenceValues(passive)).not.toHaveProperty("projectileSpeed");
  });
  it("preserves reviewed focus skills but discards unknown or malformed focus identifiers", () => {
    expect(normalizePassiveOptimizationSettings({ focusSkillId: "enfeeble" }).focusSkillId).toBe("enfeeble");
    expect(normalizePassiveOptimizationSettings({ focusSkillId: "removed-skill" })).not.toHaveProperty("focusSkillId");
    expect(normalizePassiveOptimizationSettings({ focusSkillId: { id: "enfeeble" } })).not.toHaveProperty("focusSkillId");
  });
  it.each(["spark", "fireball"])("matches spell-only critical chance for the %s hit focus", (focusSkillId) => {
    expect(passivePreferenceValues(node("15% increased Critical Hit Chance for Spells", "30% increased Critical Hit Chance for Attacks", "12% increased Area of Effect for Attacks"), { focusSkillId }))
      .toEqual({ criticalChance: 15 });
  });
  it("matches attack-only critical chance and area only for the reviewed attack focus", () => {
    expect(passivePreferenceValues(node("15% increased Critical Hit Chance for Spells", "30% increased Critical Hit Chance for Attacks", "12% increased Area of Effect for Attacks"), { focusSkillId: "lightning-arrow" }))
      .toEqual({ criticalChance: 30, areaOfEffect: 12 });
  });
  it.each(["ice-strike", "tempest-flurry", "boneshatter", "rolling-slam"])("uses attack, not spell or projectile, scopes for %s", (focusSkillId) => {
    expect(passivePreferenceValues(node("15% increased Critical Hit Chance for Attacks", "10% increased Area of Effect for Attacks",
      "30% increased Critical Hit Chance for Spells", "20% increased Projectile Speed for Spell Skills"), { focusSkillId }))
      .toEqual({ criticalChance: 15, areaOfEffect: 10 });
  });
  it.each([undefined, "unknown", "enfeeble", "essence-drain", "skeletal-arsonist"])("does not infer crit/attack-area scopes for %s", (focusSkillId) => {
    expect(passivePreferenceValues(node("15% increased Critical Hit Chance for Spells", "30% increased Critical Hit Chance for Attacks", "12% increased Area of Effect for Attacks"), { focusSkillId }))
      .toEqual({});
  });
  it.each(["ice-shot", "rain-of-arrows", "lightning-spear", "explosive-spear"])("keeps projectile and attack scopes separate from spell-only bonuses for %s", (focusSkillId) => {
    expect(passivePreferenceValues(node("15% increased Critical Hit Chance for Attacks", "10% increased Area of Effect for Attacks",
      "8% increased Projectile Speed", "30% increased Critical Hit Chance for Spells", "20% increased Projectile Speed for Spell Skills"), { focusSkillId }))
      .toEqual({ criticalChance: 15, projectileSpeed: 8, ...(focusSkillId === "ice-shot" ? {} : { areaOfEffect: 10 }) });
  });
  it("counts mixed general/scoped critical and area values once, including reductions", () => {
    const crit = node("15% increased Critical Hit Chance", "15% increased Critical Hit Chance for Spells", "5% reduced Critical Hit Chance for Spells", "30% increased Critical Hit Chance for Attacks");
    expect(passivePreferenceValues(crit, { focusSkillId: "spark" })).toEqual({ criticalChance: 25 });
    expect(scorePassiveNode(crit, [{ id: "criticalChance", weight: 3 }], { focusSkillId: "spark" })).toBe(5);
    expect(passivePreferenceValues(crit, { focusSkillId: "lightning-arrow" })).toEqual({ criticalChance: 45 });
    const area = node("10% increased Area of Effect", "12% increased Area of Effect for Attacks", "4% reduced Area of Effect for Attacks");
    expect(passivePreferenceValues(area, { focusSkillId: "lightning-arrow" })).toEqual({ areaOfEffect: 18 });
    expect(passivePreferenceValues(area, { focusSkillId: "fireball" })).toEqual({ areaOfEffect: 10 });
  });
  it("handles negative and zero-net scoped bonuses without changing generic-only callers", () => {
    expect(passivePreferenceValues(node("15% reduced Critical Hit Chance for Spells"), { focusSkillId: "spark" })).toEqual({ criticalChance: -15 });
    expect(passivePreferenceValues(node("8% reduced Critical Hit Chance for Attacks", "6% reduced Area of Effect for Attacks"), { focusSkillId: "lightning-arrow" }))
      .toEqual({ criticalChance: -8, areaOfEffect: -6 });
    expect(passivePreferenceValues(node("15% increased Critical Hit Chance for Spells", "15% reduced Critical Hit Chance for Spells"), { focusSkillId: "spark" })).toEqual({ criticalChance: 0 });
    expect(passivePreferenceValues(node("15% increased Critical Hit Chance", "15% increased Critical Hit Chance for Spells"))).toEqual({ criticalChance: 15 });
  });
  it("keeps base overrides, conditionals, minion modifiers, area damage and critical damage out of these matches", () => {
    const invalid = node("Base Critical Hit Chance for Spells is 15%", "15% more Critical Hit Chance for Spells",
      "15% increased Critical Hit Chance for Spells if you've Cast Recently", "15% increased Critical Hit Chance for Attacks\nwhile stationary",
      "Minions have 15% increased Critical Hit Chance for Attacks", "20% increased Critical Damage Bonus for Attack Damage while stationary",
      "15% increased Attack Area Damage", "4% increased Area of Effect for Attacks per Enemy you've Ignited in the last 8 seconds, up to 40%",
      "10% increased Area of Effect for Attacks\nif you've Stunned Recently", "..% increased Area of Effect for Attacks");
    for (const focusSkillId of ["spark", "lightning-arrow"]) expect(passivePreferenceValues(invalid, { focusSkillId })).toEqual({});
    expect(passivePreferenceValues(node("  2.5%   increased Critical Hit Chance for Spells "), { focusSkillId: "fireball" })).toEqual({ criticalChance: 2.5 });
  });
  it("lets Controlled Destruction block only scoped spell crit, preserving generic manual crit and speed", () => {
    const passive = node("15% increased Critical Hit Chance", "30% increased Critical Hit Chance for Spells", "15% increased Projectile Speed for Spell Skills");
    expect(passivePreferenceValues(passive, { focusSkillId: "spark", supportGemIds: ["controlled-destruction"] })).toEqual({ criticalChance: 15, projectileSpeed: 15 });
    expect(passivePreferenceValues(passive, { focusSkillId: "spark", supportGemIds: ["unreviewed"] })).toEqual({ criticalChance: 45, projectileSpeed: 15 });
    expect(passivePreferenceValues(node("30% increased Critical Hit Chance for Attacks"), { focusSkillId: "lightning-arrow", supportGemIds: ["controlled-destruction"] })).toEqual({ criticalChance: 30 });
  });
  it("normalizes unknown, duplicate, invalid and unbounded settings", () => {
    expect(normalizePassiveOptimizationSettings({ mode: "weighted", extraPointBudget: -5, preferences: [
      { id: "life", weight: 2 }, { id: "life", weight: 3 }, { id: "bogus", weight: 1 }, { id: "mana", weight: Infinity },
    ] })).toEqual({ mode: "weighted", extraPointBudget: 0, preferences: [{ id: "life", weight: 3 }] });
  });
});
