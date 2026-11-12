import { describe, expect, it } from "vitest";
import { defaultPassiveOptimizationSettings, passivePreferenceCatalog } from "./passivePreferences";
import type { SavedBuild } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";

describe("saved build transfer", () => {
  it("preserves fixed weapon attachments and leaves legacy builds readable", () => {
    const build = fixtureSavedBuild("fixed-weapons", "Fixed weapons");
    build.state.weaponSetAttachmentNodeIds = ["anchor-a", "anchor-b"];
    expect(parseSavedBuildExport(serializeSavedBuildExport([build]))[0]).toEqual(build);
    delete build.state.weaponSetAttachmentNodeIds;
    expect(parseSavedBuildExport(serializeSavedBuildExport([build]))[0]).toEqual(build);
  });
  it.each(["infernal-cry", "seismic-cry", "ancestral-cry", "fortifying-cry", "ferocious-roar"])("transfers %s's reviewed utility supports without applying priorities", (focusSkillId) => {
    const supports = ["magnified-area-i", "magnified-area-ii", ...(["infernal-cry", "ancestral-cry", "fortifying-cry"].includes(focusSkillId) ? ["prolonged-duration-i", "prolonged-duration-ii"] : []),
      "efficiency-i", "efficiency-ii", ...(focusSkillId === "ferocious-roar" ? [] : ["mobility"]),
      "raging-cry", ...(focusSkillId === "seismic-cry" ? ["exposing-cry"] : []), ...(focusSkillId === "ancestral-cry" ? [] : ["enraged-warcry-i", "enraged-warcry-ii"]),
      ...(focusSkillId === "ancestral-cry" ? [] : ["echoing-cry"]), "corrupting-cry-i", "corrupting-cry-ii"];
    for (const supportGemIds of [...supports.map((id) => [id]), supports.filter((id) => !id.endsWith("-i"))]) {
      const build = fixtureSavedBuild("warcry-utility", "Warcry utility");
      build.state.optimizerSettings = { mode: "weighted", extraPointBudget: 9, pointBudgetMode: "all-available", focusSkillId,
        supportGemIds, preferences: [{ id: "warcrySpeed", weight: 1 }, { id: "armour", weight: 3 }] };
      expect(parseSavedBuildExport(serializeSavedBuildExport([build]))[0]).toEqual(build);
    }
  });
  it.each(["snipers-mark", "bloodhounds-mark", "freezing-mark", "voltaic-mark"])("transfers %s's reviewed utility supports without applying priorities", (focusSkillId) => {
    for (const supportGemIds of [["mobility"], ["efficiency-i"], ["efficiency-ii"], ["prolonged-duration-i"], ["prolonged-duration-ii"], ["mobility", "efficiency-ii", "prolonged-duration-ii"]]) {
      const build = fixtureSavedBuild("mark-utility", "Mark utility");
      build.state.optimizerSettings = { mode: "weighted", extraPointBudget: 9, pointBudgetMode: "all-available", focusSkillId,
        supportGemIds, preferences: [{ id: "markDuration", weight: 1 }, { id: "energyShield", weight: 3 }] };
      expect(parseSavedBuildExport(serializeSavedBuildExport([build]))[0]).toEqual(build);
    }
  });
  it.each([["contagion", "magnified-area-ii"], ["despair", "prolonged-duration-ii"], ["dark-effigy", "mobility"], ["dark-effigy", "rapid-casting-iii"],
    ["bonestorm", "considered-casting"], ["despair", "spell-echo"], ["bonestorm", "projectile-acceleration-ii"], ["detonate-dead", "brutality-iii"],
    ["skeletal-sniper", "feeding-frenzy-ii"], ["skeletal-frost-mage", "rapid-casting-i"], ["skeletal-cleric", "rapid-casting-ii"], ["bone-offering", "prolonged-duration-ii"], ["pain-offering", "efficiency-ii"]])
    ("transfers %s with reviewed %s without applying priorities", (focusSkillId, supportId) => {
      const build = fixtureSavedBuild("chaos-utility", "Scoped support");
      build.state.optimizerSettings = { mode: "weighted", extraPointBudget: 9, pointBudgetMode: "all-available", focusSkillId,
        supportGemIds: [supportId], preferences: [{ id: "castSpeed", weight: 1 }, { id: "energyShield", weight: 3 }] };
      expect(parseSavedBuildExport(serializeSavedBuildExport([build]))[0]).toEqual(build);
    });
  it.each(["magnified-area-i", "magnified-area-ii", "prolonged-duration-i", "prolonged-duration-ii", "efficiency-i", "efficiency-ii", "mobility"])
    ("retains %s through JSON transfer alongside manual utility priorities", (supportId) => {
      const build = fixtureSavedBuild("utility-support", "Utility support");
      build.state.optimizerSettings = { mode: "weighted", extraPointBudget: 9, pointBudgetMode: "all-available", focusSkillId: "firestorm", supportGemIds: [supportId],
        preferences: [{ id: "skillDuration", weight: 1 }, { id: "energyShield", weight: 3 }, { id: "skillMovementPenaltyReduction", weight: 2 }] };
      expect(parseSavedBuildExport(serializeSavedBuildExport([build]))[0]).toEqual(build);
    });
  it.each(["projectile-acceleration-i", "projectile-acceleration-ii", "considered-casting", "rapid-casting-i", "rapid-casting-ii", "rapid-casting-iii", "spell-echo"])
    ("retains the reviewed %s selection through JSON transfer without applying priorities", (supportId) => {
      const build = fixtureSavedBuild("supported-spell", "Supported spell");
      build.state.optimizerSettings = { mode: "weighted", extraPointBudget: 9, focusSkillId: supportId === "spell-echo" ? "comet" : "frostbolt",
        supportGemIds: [supportId], preferences: [{ id: "castSpeed", weight: 1 }, { id: "energyShield", weight: 3 }] };
      expect(parseSavedBuildExport(serializeSavedBuildExport([build]))[0]).toEqual(build);
    });
  it.each(["arc", "ball-lightning", "frostbolt", "ice-nova", "comet", "firestorm", "eye-of-winter", "frost-bomb", "flameblast", "frost-wall",
    "contagion", "bonestorm", "bone-cage", "despair", "vulnerability", "hexblast", "unearth", "detonate-dead", "dark-effigy",
    "skeletal-sniper", "skeletal-frost-mage", "skeletal-storm-mage", "skeletal-brute", "skeletal-cleric", "skeletal-reaver", "bone-offering", "pain-offering",
    "infernal-cry", "seismic-cry", "ancestral-cry", "fortifying-cry", "ferocious-roar"])
    ("retains the %s focus and manual settings through JSON transfer", (focusSkillId) => {
      const build = fixtureSavedBuild("spell-focus", "New spell focus");
      build.state.optimizerSettings = { mode: "weighted", extraPointBudget: 9, pointBudgetMode: "all-available", focusSkillId,
        preferences: [{ id: "spellDamage", weight: 1 }, { id: "energyShield", weight: 3 }, { id: "criticalChance", weight: 2 }] };
      expect(parseSavedBuildExport(serializeSavedBuildExport([build]))[0]).toEqual(build);
    });
  it("retains every current preference through JSON transfer without changing focus, supports or budgets", () => {
    const build = fixtureSavedBuild("complete-preferences", "All preference IDs");
    build.state.optimizerSettings = { mode: "weighted", extraPointBudget: 9, pointBudgetMode: "all-available", focusSkillId: "fireball",
      supportGemIds: ["controlled-destruction"], preferences: passivePreferenceCatalog.map(({ id }, i) => ({ id, weight: i % 3 + 1 })) };
    expect(parseSavedBuildExport(serializeSavedBuildExport([build]))[0]).toEqual(build);
  });
  it("retains critical damage and buildup priorities through JSON transfer without changing the focus or budget", () => {
    const build = fixtureSavedBuild("buildup", "Buildup priorities");
    build.state.optimizerSettings = { mode: "weighted", extraPointBudget: 7, pointBudgetMode: "all-available", focusSkillId: "ice-strike",
      preferences: [{ id: "criticalDamageBonus", weight: 3 }, { id: "stunBuildup", weight: 2 }, { id: "freezeBuildup", weight: 1 }, { id: "criticalChance", weight: 2 }] };
    expect(parseSavedBuildExport(serializeSavedBuildExport([build]))[0]).toEqual(build);
  });
  it("retains accuracy, block and stun priorities alongside existing preferences and budget through JSON transfer", () => {
    const build = fixtureSavedBuild("combat", "Combat priorities");
    build.state.optimizerSettings = { mode: "weighted", extraPointBudget: 7, pointBudgetMode: "all-available", focusSkillId: "lightning-arrow",
      preferences: [{ id: "accuracy", weight: 3 }, { id: "blockChance", weight: 2 }, { id: "stunThreshold", weight: 1 }, { id: "energyShield", weight: 2 }] };
    expect(parseSavedBuildExport(serializeSavedBuildExport([build]))[0]).toEqual(build);
  });
  it("retains the four opt-in recovery priorities through JSON transfer", () => {
    const build = fixtureSavedBuild("recovery", "Recovery priorities");
    build.state.optimizerSettings = { mode: "weighted", extraPointBudget: 5, preferences: [
      { id: "energyShieldRechargeStart", weight: 3 }, { id: "energyShieldRechargeRate", weight: 2 },
      { id: "lifeRegenerationRate", weight: 1 }, { id: "manaRegenerationRate", weight: 2 },
    ] };
    expect(parseSavedBuildExport(serializeSavedBuildExport([build]))[0]).toEqual(build);
  });
  it("round-trips Fireball's separate damage and coverage priorities through JSON transfer", () => {
    const build = fixtureSavedBuild("fireball", "Fireball explosion");
    build.state.optimizerSettings = { mode: "weighted", extraPointBudget: 7, focusSkillId: "fireball", supportGemIds: ["controlled-destruction"],
      preferences: [{ id: "spellAreaDamage", weight: 2 }, { id: "areaOfEffect", weight: 3 }] };
    expect(parseSavedBuildExport(serializeSavedBuildExport([build]))[0]).toEqual(build);
  });
  it("serializes and parses saved build export payloads", () => {
    const build = fixtureSavedBuild("build-1", "Shared build");

    const json = serializeSavedBuildExport([build], "2026-06-04T12:00:00.000Z");
    const parsedPayload = JSON.parse(json);

    expect(parsedPayload).toMatchObject({
      schemaVersion: 1,
      exportedAt: "2026-06-04T12:00:00.000Z",
      builds: [{ id: "build-1", name: "Shared build" }],
    });
    expect(parseSavedBuildExport(json)).toEqual([build]);
  });

  it("rejects export payloads without any valid saved builds", () => {
    expect(() => parseSavedBuildExport(JSON.stringify({ schemaVersion: 1, builds: [] })))
      .toThrow("No saved builds found in import file.");
    expect(() => parseSavedBuildExport("{bad json"))
      .toThrow("Saved build import file is not valid JSON.");
  });
  it("round-trips reviewed supports and applied priorities with exported builds", () => {
    const build = fixtureSavedBuild("supported", "Supported Spark");
    build.state.optimizerSettings = { mode: "weighted", extraPointBudget: 7, focusSkillId: "spark",
      supportGemIds: ["projectile-acceleration-iii", "controlled-destruction"],
      preferences: [{ id: "projectileSpeed", weight: 3 }, { id: "energyShield", weight: 2 }] };
    expect(parseSavedBuildExport(serializeSavedBuildExport([build]))[0]).toEqual(build);
  });

  it("imports legacy saved builds without weapon set fields as empty main-mode builds", () => {
    const legacyBuild = fixtureSavedBuild("legacy", "Legacy build");
    delete (legacyBuild.state as Partial<SavedBuild["state"]>).activeAllocationMode;
    delete (legacyBuild.state as Partial<SavedBuild["state"]>).weaponSetAllocationNodeIds;
    delete legacyBuild.state.optimizerSettings;

    expect(parseSavedBuildExport(JSON.stringify({ builds: [legacyBuild] }))[0].state).toMatchObject({
      activeAllocationMode: "main",
      weaponSetAllocationNodeIds: { 1: [], 2: [] },
      optimizerSettings: defaultPassiveOptimizationSettings(),
    });
  });
  it("retains a new melee focus and supports through JSON export/import", () => {
    const build = fixtureSavedBuild("melee", "Rolling Slam");
    build.state.optimizerSettings = { mode: "weighted", extraPointBudget: 7, focusSkillId: "rolling-slam",
      supportGemIds: ["heavy-swing", "rapid-attacks-ii", "fist-of-war-i"],
      preferences: [{ id: "physicalDamage", weight: 3 }, { id: "attackSpeed", weight: 2 }] };
    expect(parseSavedBuildExport(serializeSavedBuildExport([build]))[0]).toEqual(build);
  });
  it.each(["ice-shot", "rain-of-arrows", "lightning-spear", "explosive-spear"])("retains the %s focus and reviewed projectile supports through JSON transfer", (focusSkillId) => {
    const build = fixtureSavedBuild("ranged", "Ranged focus");
    build.state.optimizerSettings = { mode: "weighted", extraPointBudget: 4, focusSkillId,
      supportGemIds: ["projectile-acceleration-iii", "rapid-attacks-ii"],
      preferences: [{ id: "projectileSpeed", weight: 3 }, { id: "energyShield", weight: 2 }] };
    expect(parseSavedBuildExport(serializeSavedBuildExport([build]))[0]).toEqual(build);
  });
});

function fixtureSavedBuild(id: string, name: string): SavedBuild {
  return {
    id,
    name,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    state: {
      selectedClassStartId: "witch",
      pathStartNodeId: "1000",
      allocationPlan: {
        committedNodePath: ["1000"],
        committedEdgeKeys: [],
        previewNodePath: [],
        previewEdgeKeys: [],
        previewRouteNodePath: [],
      },
      nodeVisualScale: 3,
      buildGoalNodeIds: [],
      ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main",
      weaponSetAllocationNodeIds: { 1: [], 2: [] },
      optimizerSettings: defaultPassiveOptimizationSettings(),
    },
  };
}
