import { afterEach, describe, expect, it } from "vitest";
import {
  defaultPassiveOptimizationSettings,
  normalizePassiveOptimizationSettings,
  passivePreferenceCatalog,
  type PassiveOptimizationSettings,
} from "./passivePreferences";
import {
  loadSavedBuilds,
  normalizeSavedBuilds,
  savedBuildsStorageKey,
  storeSavedBuilds,
  type SavedBuild,
} from "./savedBuilds";

afterEach(() => localStorage.removeItem(savedBuildsStorageKey));

describe("saved build optimizer settings persistence", () => {
  it.each(["infernal-cry", "seismic-cry", "ancestral-cry", "fortifying-cry", "ferocious-roar"])("round-trips %s's reviewed utility supports without applying priorities", (focusSkillId) => {
    const supports = ["magnified-area-i", "magnified-area-ii", ...(["infernal-cry", "ancestral-cry", "fortifying-cry"].includes(focusSkillId) ? ["prolonged-duration-i", "prolonged-duration-ii"] : []),
      "efficiency-i", "efficiency-ii", ...(focusSkillId === "ferocious-roar" ? [] : ["mobility"]),
      "raging-cry", ...(focusSkillId === "seismic-cry" ? ["exposing-cry"] : []), ...(focusSkillId === "ancestral-cry" ? [] : ["enraged-warcry-i", "enraged-warcry-ii"]),
      ...(focusSkillId === "ancestral-cry" ? [] : ["echoing-cry"]), "corrupting-cry-i", "corrupting-cry-ii"];
    for (const supportGemIds of [...supports.map((id) => [id]), supports.filter((id) => !id.endsWith("-i"))]) {
      const optimizerSettings: PassiveOptimizationSettings = { mode: "weighted", extraPointBudget: 9, pointBudgetMode: "all-available", focusSkillId,
        supportGemIds, preferences: [{ id: "warcrySpeed", weight: 1 }, { id: "armour", weight: 3 }] };
      storeSavedBuilds([fixtureSavedBuild(optimizerSettings)], localStorage);
      expect(loadSavedBuilds(localStorage)[0].state.optimizerSettings).toEqual(optimizerSettings);
    }
  });
  it.each(["snipers-mark", "bloodhounds-mark", "freezing-mark", "voltaic-mark"])("round-trips %s's reviewed utility supports without applying priorities", (focusSkillId) => {
    for (const supportGemIds of [["mobility"], ["efficiency-i"], ["efficiency-ii"], ["prolonged-duration-i"], ["prolonged-duration-ii"], ["mobility", "efficiency-ii", "prolonged-duration-ii"]]) {
      const optimizerSettings: PassiveOptimizationSettings = { mode: "weighted", extraPointBudget: 9, pointBudgetMode: "all-available", focusSkillId,
        supportGemIds, preferences: [{ id: "markDuration", weight: 1 }, { id: "energyShield", weight: 3 }] };
      storeSavedBuilds([fixtureSavedBuild(optimizerSettings)], localStorage);
      expect(loadSavedBuilds(localStorage)[0].state.optimizerSettings).toEqual(optimizerSettings);
    }
  });
  it.each([["contagion", "magnified-area-ii"], ["despair", "prolonged-duration-ii"], ["dark-effigy", "mobility"], ["dark-effigy", "rapid-casting-iii"],
    ["bonestorm", "considered-casting"], ["despair", "spell-echo"], ["bonestorm", "projectile-acceleration-ii"], ["detonate-dead", "brutality-iii"],
    ["skeletal-sniper", "feeding-frenzy-ii"], ["skeletal-frost-mage", "rapid-casting-i"], ["skeletal-cleric", "rapid-casting-ii"], ["bone-offering", "prolonged-duration-ii"], ["pain-offering", "efficiency-ii"]])
    ("retains %s with reviewed %s and unchanged manual settings", (focusSkillId, supportId) => {
      const optimizerSettings: PassiveOptimizationSettings = { mode: "weighted", extraPointBudget: 9, pointBudgetMode: "all-available", focusSkillId,
        supportGemIds: [supportId], preferences: [{ id: "castSpeed", weight: 1 }, { id: "energyShield", weight: 3 }] };
      storeSavedBuilds([fixtureSavedBuild(optimizerSettings)], localStorage);
      expect(loadSavedBuilds(localStorage)[0].state.optimizerSettings).toEqual(optimizerSettings);
    });
  it.each(["magnified-area-i", "magnified-area-ii", "prolonged-duration-i", "prolonged-duration-ii", "efficiency-i", "efficiency-ii", "mobility"])
    ("round-trips %s without changing priorities or the point budget", (supportId) => {
      const optimizerSettings: PassiveOptimizationSettings = { mode: "weighted", extraPointBudget: 9, pointBudgetMode: "all-available", focusSkillId: "firestorm",
        supportGemIds: [supportId], preferences: [{ id: "skillDuration", weight: 1 }, { id: "energyShield", weight: 3 }, { id: "skillMovementPenaltyReduction", weight: 2 }] };
      storeSavedBuilds([fixtureSavedBuild(optimizerSettings)], localStorage);
      expect(loadSavedBuilds(localStorage)[0].state.optimizerSettings).toEqual(optimizerSettings);
    });
  it.each(["projectile-acceleration-i", "projectile-acceleration-ii", "considered-casting", "rapid-casting-i", "rapid-casting-ii", "rapid-casting-iii", "spell-echo"])
    ("round-trips the reviewed %s selection and existing weights", (supportId) => {
      const optimizerSettings: PassiveOptimizationSettings = { mode: "weighted", extraPointBudget: 9, focusSkillId: supportId === "spell-echo" ? "comet" : "frostbolt",
        supportGemIds: [supportId], preferences: [{ id: "castSpeed", weight: 1 }, { id: "energyShield", weight: 3 }] };
      storeSavedBuilds([fixtureSavedBuild(optimizerSettings)], localStorage);
      expect(loadSavedBuilds(localStorage)[0].state.optimizerSettings).toEqual(optimizerSettings);
    });
  it.each(["arc", "ball-lightning", "frostbolt", "ice-nova", "comet", "firestorm", "eye-of-winter", "frost-bomb", "flameblast", "frost-wall",
    "contagion", "bonestorm", "bone-cage", "despair", "vulnerability", "hexblast", "unearth", "detonate-dead", "dark-effigy",
    "skeletal-sniper", "skeletal-frost-mage", "skeletal-storm-mage", "skeletal-brute", "skeletal-cleric", "skeletal-reaver", "bone-offering", "pain-offering",
    "infernal-cry", "seismic-cry", "ancestral-cry", "fortifying-cry", "ferocious-roar"])
    ("round-trips the %s focus without adding suggestions or editing saved priorities", (focusSkillId) => {
      const optimizerSettings: PassiveOptimizationSettings = { mode: "weighted", extraPointBudget: 9, pointBudgetMode: "all-available", focusSkillId,
        preferences: [{ id: "spellDamage", weight: 1 }, { id: "energyShield", weight: 3 }, { id: "criticalChance", weight: 2 }] };
      storeSavedBuilds([fixtureSavedBuild(optimizerSettings)], localStorage);
      expect(loadSavedBuilds(localStorage)[0].state.optimizerSettings).toEqual(optimizerSettings);
    });
  it("round-trips every catalog preference, including the combined elemental/ailment batch, with edited priorities", () => {
    const optimizerSettings: PassiveOptimizationSettings = { mode: "weighted", extraPointBudget: 9, pointBudgetMode: "all-available", focusSkillId: "fireball",
      supportGemIds: ["controlled-destruction"], preferences: passivePreferenceCatalog.map(({ id }, i) => ({ id, weight: i % 3 + 1 })) };
    storeSavedBuilds([fixtureSavedBuild(optimizerSettings)], localStorage);
    expect(loadSavedBuilds(localStorage)[0].state.optimizerSettings).toEqual(optimizerSettings);
  });
  it("round-trips opt-in critical damage and buildup priorities alongside existing settings", () => {
    const optimizerSettings: PassiveOptimizationSettings = { mode: "weighted", extraPointBudget: 7, pointBudgetMode: "all-available", focusSkillId: "ice-strike",
      preferences: [{ id: "criticalDamageBonus", weight: 3 }, { id: "stunBuildup", weight: 2 }, { id: "freezeBuildup", weight: 1 }, { id: "criticalChance", weight: 2 }] };
    storeSavedBuilds([fixtureSavedBuild(optimizerSettings)], localStorage);
    expect(loadSavedBuilds(localStorage)[0].state.optimizerSettings).toEqual(optimizerSettings);
  });
  it("round-trips opt-in accuracy, block and stun priorities without replacing existing preferences or budgets", () => {
    const optimizerSettings: PassiveOptimizationSettings = { mode: "weighted", extraPointBudget: 7, pointBudgetMode: "all-available", focusSkillId: "lightning-arrow",
      preferences: [{ id: "accuracy", weight: 3 }, { id: "blockChance", weight: 2 }, { id: "stunThreshold", weight: 1 }, { id: "energyShield", weight: 2 }] };
    storeSavedBuilds([fixtureSavedBuild(optimizerSettings)], localStorage);
    expect(loadSavedBuilds(localStorage)[0].state.optimizerSettings).toEqual(optimizerSettings);
  });
  it("round-trips separate recovery priorities without replacing older pool priorities or budgets", () => {
    const optimizerSettings: PassiveOptimizationSettings = { mode: "weighted", extraPointBudget: 7, pointBudgetMode: "all-available", preferences: [
      { id: "energyShield", weight: 3 }, { id: "energyShieldRechargeStart", weight: 2 }, { id: "energyShieldRechargeRate", weight: 1 },
      { id: "lifeRegenerationRate", weight: 3 }, { id: "manaRegenerationRate", weight: 2 },
    ] };
    storeSavedBuilds([fixtureSavedBuild(optimizerSettings)], localStorage);
    expect(loadSavedBuilds(localStorage)[0].state.optimizerSettings).toEqual(optimizerSettings);
  });
  it("retains older Fireball preferences unchanged and round-trips opt-in explosion damage", () => {
    const old: PassiveOptimizationSettings = { mode: "weighted", focusSkillId: "fireball", extraPointBudget: 7, preferences: [{ id: "areaOfEffect", weight: 3 }] };
    storeSavedBuilds([fixtureSavedBuild(old)], localStorage);
    expect(loadSavedBuilds(localStorage)[0].state.optimizerSettings).toEqual(old);
    const updated: PassiveOptimizationSettings = { ...old, supportGemIds: ["controlled-destruction"], preferences: [...old.preferences, { id: "spellAreaDamage", weight: 2 }] };
    storeSavedBuilds([fixtureSavedBuild(updated)], localStorage);
    expect(loadSavedBuilds(localStorage)[0].state.optimizerSettings).toEqual(updated);
  });
  it.each(["ice-shot", "rain-of-arrows", "lightning-spear", "explosive-spear"])("round-trips the %s bow/spear focus, supports and manual priorities", (focusSkillId) => {
    const optimizerSettings: PassiveOptimizationSettings = { mode: "weighted", focusSkillId,
      supportGemIds: ["projectile-acceleration-iii", "rapid-attacks-ii"], pointBudgetMode: "all-available", extraPointBudget: 9,
      preferences: [{ id: "projectileSpeed", weight: 3 }, { id: "energyShield", weight: 2 }] };
    storeSavedBuilds([fixtureSavedBuild(optimizerSettings)], localStorage);
    expect(loadSavedBuilds(localStorage)[0].state.optimizerSettings).toEqual(optimizerSettings);
  });
  it.each(["ice-strike", "tempest-flurry", "boneshatter", "rolling-slam"])("round-trips the %s melee focus, supports and edited weights", (focusSkillId) => {
    const optimizerSettings: PassiveOptimizationSettings = { mode: "weighted", focusSkillId,
      supportGemIds: ["rapid-attacks-ii", "concentrated-area"], pointBudgetMode: "all-available", extraPointBudget: 7,
      preferences: [{ id: "areaOfEffect", weight: 2 }, { id: "energyShield", weight: 3 }] };
    storeSavedBuilds([fixtureSavedBuild(optimizerSettings)], localStorage);
    expect(loadSavedBuilds(localStorage)[0].state.optimizerSettings).toEqual(optimizerSettings);
  });
  it("round-trips focus skill, custom priorities and the all-available budget", () => {
    const optimizerSettings: PassiveOptimizationSettings = {
      mode: "weighted", focusSkillId: "enfeeble", supportGemIds: ["ritualistic-curse", "focused-curse"], pointBudgetMode: "all-available", extraPointBudget: 7,
      preferences: [{ id: "curseMagnitude", weight: 3 }, { id: "energyShield", weight: 2 }],
    };
    storeSavedBuilds([fixtureSavedBuild(optimizerSettings)], localStorage);
    expect(loadSavedBuilds(localStorage)[0].state.optimizerSettings).toEqual(optimizerSettings);
  });
  it("round-trips weighted settings through storage", () => {
    const optimizerSettings: PassiveOptimizationSettings = {
      mode: "weighted",
      extraPointBudget: 3,
      preferences: [{ id: passivePreferenceCatalog[0].id, weight: 2 }],
    };
    const build = fixtureSavedBuild(optimizerSettings);

    storeSavedBuilds([build], localStorage);

    expect(JSON.parse(localStorage.getItem(savedBuildsStorageKey)!).at(0).state.optimizerSettings)
      .toEqual(optimizerSettings);
    expect(loadSavedBuilds(localStorage)[0].state.optimizerSettings).toEqual(optimizerSettings);
  });

  it("round-trips all-available mode without losing the extra budget", () => {
    const optimizerSettings: PassiveOptimizationSettings = {
      mode: "weighted",
      pointBudgetMode: "all-available",
      extraPointBudget: 7,
      preferences: [{ id: passivePreferenceCatalog[0].id, weight: 2 }],
    };

    storeSavedBuilds([fixtureSavedBuild(optimizerSettings)], localStorage);

    expect(JSON.parse(localStorage.getItem(savedBuildsStorageKey)!).at(0).state.optimizerSettings)
      .toEqual(optimizerSettings);
    expect(loadSavedBuilds(localStorage)[0].state.optimizerSettings).toEqual(optimizerSettings);
  });

  it.each(["extra", "unknown", null, undefined, 123])(
    "normalizes point budget mode %j to extra by omitting the mode key",
    (pointBudgetMode) => {
      const optimizerSettings: PassiveOptimizationSettings = {
        mode: "weighted",
        extraPointBudget: 7,
        preferences: [{ id: passivePreferenceCatalog[0].id, weight: 2 }],
      };
      const build = fixtureSavedBuild(optimizerSettings);
      localStorage.setItem(savedBuildsStorageKey, JSON.stringify([{
        ...build,
        state: { ...build.state, optimizerSettings: { ...optimizerSettings, pointBudgetMode } },
      }]));

      const [loadedBuild] = loadSavedBuilds(localStorage);

      expect(loadedBuild.id).toBe(build.id);
      expect(loadedBuild.state.optimizerSettings).toEqual(optimizerSettings);
      expect(loadedBuild.state.optimizerSettings).not.toHaveProperty("pointBudgetMode");
      expect(loadedBuild.state.allocationPlan).toEqual(build.state.allocationPlan);
    },
  );

  it("loads old saves without optimizer settings using defaults", () => {
    const legacyBuild = fixtureSavedBuild();
    expect(legacyBuild.state).not.toHaveProperty("optimizerSettings");
    localStorage.setItem(savedBuildsStorageKey, JSON.stringify([legacyBuild]));

    const [loadedBuild] = loadSavedBuilds(localStorage);

    expect(defaultPassiveOptimizationSettings()).toEqual({ mode: "shortest", extraPointBudget: 5, preferences: [] });
    expect(loadedBuild.state.optimizerSettings).toEqual(defaultPassiveOptimizationSettings());
    expect(loadedBuild.state.allocationPlan).toEqual(legacyBuild.state.allocationPlan);
  });

  it.each([null, "weighted", {}, { mode: "unknown", preferences: null }])(
    "normalizes malformed settings without losing the build: %j",
    (optimizerSettings) => {
      const build = fixtureSavedBuild();
      const [normalizedBuild] = normalizeSavedBuilds([{
        ...build,
        state: { ...build.state, optimizerSettings },
      }]);

      expect(normalizedBuild.id).toBe(build.id);
      expect(normalizedBuild.state.optimizerSettings)
        .toEqual(normalizePassiveOptimizationSettings(optimizerSettings));
    },
  );

  it.each([-20, 2.75, Number.NaN, Number.POSITIVE_INFINITY, "5"])(
    "delegates invalid budget sanitation to the settings normalizer: %s",
    (extraPointBudget) => {
      const optimizerSettings = { mode: "weighted", extraPointBudget, preferences: [] };
      const build = fixtureSavedBuild();
      const [normalizedBuild] = normalizeSavedBuilds([{
        ...build,
        state: { ...build.state, optimizerSettings },
      }]);

      expect(normalizedBuild.state.optimizerSettings)
        .toEqual(normalizePassiveOptimizationSettings(optimizerSettings));
      expect(Number.isInteger(normalizedBuild.state.optimizerSettings?.extraPointBudget)).toBe(true);
      expect(normalizedBuild.state.optimizerSettings?.extraPointBudget).toBeGreaterThanOrEqual(0);
    },
  );

  it.each([-1, 0, 0.5, 1.6, 99, Number.NaN, Number.POSITIVE_INFINITY, "2"])(
    "delegates invalid weight sanitation to the settings normalizer: %s",
    (weight) => {
      const optimizerSettings = {
        mode: "weighted",
        extraPointBudget: 3,
        preferences: [{ id: passivePreferenceCatalog[0].id, weight }],
      };
      const build = fixtureSavedBuild();
      const [normalizedBuild] = normalizeSavedBuilds([{
        ...build,
        state: { ...build.state, optimizerSettings },
      }]);
      const settings = normalizedBuild.state.optimizerSettings;

      expect(settings).toEqual(normalizePassiveOptimizationSettings(optimizerSettings));
      for (const preference of settings!.preferences) {
        expect(Number.isInteger(preference.weight)).toBe(true);
        expect(preference.weight).toBeGreaterThan(0);
      }
    },
  );
});

function fixtureSavedBuild(optimizerSettings?: PassiveOptimizationSettings): SavedBuild {
  return {
    id: "saved-1",
    name: "Stored build",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-02T00:00:00.000Z",
    state: {
      allocationPlan: {
        committedNodePath: ["start"],
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
      ...(optimizerSettings ? { optimizerSettings } : {}),
    },
  };
}
