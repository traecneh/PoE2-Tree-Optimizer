import { describe, expect, it } from "vitest";
import type { SavedBuild } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";

describe("saved build transfer", () => {
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

  it("imports legacy saved builds without weapon set fields as empty main-mode builds", () => {
    const legacyBuild = fixtureSavedBuild("legacy", "Legacy build");
    delete (legacyBuild.state as Partial<SavedBuild["state"]>).activeAllocationMode;
    delete (legacyBuild.state as Partial<SavedBuild["state"]>).weaponSetAllocationNodeIds;

    expect(parseSavedBuildExport(JSON.stringify({ builds: [legacyBuild] }))[0].state).toMatchObject({
      activeAllocationMode: "main",
      weaponSetAllocationNodeIds: { 1: [], 2: [] },
    });
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
    },
  };
}
