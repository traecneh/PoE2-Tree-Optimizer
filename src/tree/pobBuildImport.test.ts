import { deflateSync } from "node:zlib";
import { afterEach, describe, expect, it, vi } from "vitest";
import { importBuildGoalsFromPobCode, importBuildGoalsFromPobXml } from "./pobBuildImport";
import type { TreeGraph } from "./types";

describe("PoB build import", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("decodes a PoB build code and extracts eligible goals from the active tree spec", () => {
    const code = encodePobXml(`
      <PathOfBuilding2>
        <Build />
        <Tree activeSpec="2">
          <Spec title="Ignored" nodes="101" />
          <Spec title="Active" nodes="100,101,102,103,999" />
        </Tree>
      </PathOfBuilding2>
    `);

    const result = importBuildGoalsFromPobCode(code, fixtureGraph());

    expect(result.activeSpecTitle).toBe("Active");
    expect(result.allocatedNodeIds).toEqual(["100", "101", "102", "103", "999"]);
    expect(result.goalNodeIds).toEqual(["101", "103"]);
    expect(result.ignoredNodeIds).toEqual(["100", "102"]);
    expect(result.missingNodeIds).toEqual(["999"]);
  });

  it("falls back to the first spec when the saved active spec is not usable", () => {
    const result = importBuildGoalsFromPobXml(`
      <PathOfBuilding2>
        <Tree activeSpec="99">
          <Spec title="Fallback" nodes="101,104" />
        </Tree>
      </PathOfBuilding2>
    `, fixtureGraph());

    expect(result.activeSpecTitle).toBe("Fallback");
    expect(result.goalNodeIds).toEqual(["101", "104"]);
  });

  it("extracts specs when DOMParser is not available", () => {
    vi.stubGlobal("DOMParser", undefined);

    const result = importBuildGoalsFromPobXml(`
      <PathOfBuilding2>
        <Tree activeSpec="2">
          <Spec title="Ignored" nodes="101" />
          <Spec title="Fallback Parser" nodes="103,104" />
        </Tree>
      </PathOfBuilding2>
    `, fixtureGraph());

    expect(result.activeSpecTitle).toBe("Fallback Parser");
    expect(result.goalNodeIds).toEqual(["103", "104"]);
  });

  it("rejects invalid build codes with a useful error", () => {
    expect(() => importBuildGoalsFromPobCode("not a pob code", fixtureGraph())).toThrow("Could not decode PoB build code.");
  });
});

function encodePobXml(xml: string): string {
  return deflateSync(xml).toString("base64").replaceAll("+", "-").replaceAll("/", "_");
}

function fixtureGraph(): TreeGraph {
  return {
    schemaVersion: 1,
    gameVersion: "pob-fixture",
    extractedAt: "2026-05-26T00:00:00.000Z",
    source: { kind: "fixture", path: "src/tree/pobBuildImport.test.ts" },
    nodes: {
      "100": {
        id: "100",
        name: "Start",
        stats: [],
        position: { x: 0, y: 0 },
        flags: { classStart: true },
      },
      "101": {
        id: "101",
        name: "Required Notable",
        stats: ["20% increased Damage"],
        position: { x: 100, y: 0 },
        flags: { notable: true },
      },
      "102": {
        id: "102",
        name: "Pathing",
        stats: ["5% increased Damage"],
        position: { x: 200, y: 0 },
        flags: { small: true },
      },
      "103": {
        id: "103",
        name: "Jewel Socket",
        stats: [],
        position: { x: 300, y: 0 },
        flags: { jewelSocket: true },
      },
      "104": {
        id: "104",
        name: "Required Keystone",
        stats: ["A defining rule"],
        position: { x: 400, y: 0 },
        flags: { keystone: true },
      },
    },
    groups: {},
    edges: [],
    classStarts: { Test: "100" },
    bounds: { minX: 0, maxX: 400, minY: 0, maxY: 0 },
  };
}
