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
        <Build className="Huntress" ascendClassName="Amazon" />
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
    expect(result.className).toBe("Huntress");
    expect(result.ascendClassName).toBe("Amazon");
  });

  it("ignores ascendancy and disconnected goalable nodes", () => {
    const result = importBuildGoalsFromPobXml(`
      <PathOfBuilding2>
        <Tree activeSpec="1">
          <Spec title="Active" nodes="101,105,201" />
        </Tree>
      </PathOfBuilding2>
    `, fixtureGraph());

    expect(result.goalNodeIds).toEqual(["101"]);
    expect(result.ignoredNodeIds).toEqual(["105", "201"]);
  });

  it("ignores goalable nodes outside the imported allocated component", () => {
    const result = importBuildGoalsFromPobXml(`
      <PathOfBuilding2>
        <Tree activeSpec="1">
          <Spec title="Active" nodes="100,101,106" />
        </Tree>
      </PathOfBuilding2>
    `, fixtureGraph());

    expect(result.goalNodeIds).toEqual(["101"]);
    expect(result.ignoredNodeIds).toEqual(["100", "106"]);
  });

  it("falls back to the first spec when the saved active spec is not usable", () => {
    const result = importBuildGoalsFromPobXml(`
      <PathOfBuilding2>
        <Tree activeSpec="99">
          <Spec title="Fallback" nodes="100,101,102,103,104" />
        </Tree>
      </PathOfBuilding2>
    `, fixtureGraph());

    expect(result.activeSpecTitle).toBe("Fallback");
    expect(result.goalNodeIds).toEqual(["101", "103", "104"]);
  });

  it("extracts specs when DOMParser is not available", () => {
    vi.stubGlobal("DOMParser", undefined);

    const result = importBuildGoalsFromPobXml(`
      <PathOfBuilding2 className="Ranger" ascendClassName="Deadeye">
        <Tree activeSpec="2">
          <Spec title="Ignored" nodes="101" />
          <Spec title="Fallback Parser" nodes="100,101,102,103,104" />
        </Tree>
      </PathOfBuilding2>
    `, fixtureGraph());

    expect(result.activeSpecTitle).toBe("Fallback Parser");
    expect(result.goalNodeIds).toEqual(["101", "103", "104"]);
    expect(result.className).toBe("Ranger");
    expect(result.ascendClassName).toBe("Deadeye");
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
      "105": {
        id: "105",
        name: "Disconnected Notable",
        stats: ["20% increased Nothing"],
        position: { x: 500, y: 0 },
        flags: { notable: true },
      },
      "106": {
        id: "106",
        name: "Allocated But Unlinked Notable",
        stats: ["20% increased Imported Noise"],
        position: { x: 600, y: 0 },
        flags: { notable: true },
      },
      "107": {
        id: "107",
        name: "Unallocated Connector",
        stats: ["5% increased Imported Noise"],
        position: { x: 500, y: 0 },
        flags: { small: true },
      },
      "200": {
        id: "200",
        name: "Ascendancy Start",
        stats: [],
        position: { x: 10_000, y: 0 },
        flags: { classStart: true },
      },
      "201": {
        id: "201",
        name: "Ascendancy Notable",
        stats: ["20% increased Ascendancy Power"],
        position: { x: 10_100, y: 0 },
        flags: { notable: true },
      },
    },
    groups: {},
    edges: [
      { from: "100", to: "101" },
      { from: "101", to: "102" },
      { from: "102", to: "103" },
      { from: "103", to: "104" },
      { from: "104", to: "107" },
      { from: "107", to: "106" },
      { from: "100", to: "200" },
      { from: "200", to: "201" },
    ],
    classStarts: { Test: "100" },
    bounds: { minX: 0, maxX: 400, minY: 0, maxY: 0 },
  };
}
