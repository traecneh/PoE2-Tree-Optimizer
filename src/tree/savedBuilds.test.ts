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
