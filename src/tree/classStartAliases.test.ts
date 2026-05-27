import { describe, expect, it } from "vitest";
import { buildClassStartOptions } from "./classStartAliases";
import type { TreeGraph } from "./types";

describe("buildClassStartOptions", () => {
  it("exposes current PoE2 classes while sharing the six physical graph roots", () => {
    const graph = fixtureGraph({
      WITCH: "witch_start",
      RANGER: "ranger_start",
      MARAUDER: "marauder_start",
      DUELIST: "duelist_start",
      SIX: "six_start",
      TEMPLAR: "templar_start",
    });

    const options = buildClassStartOptions(graph);

    expect(options.map((option) => option.label)).toEqual([
      "Witch",
      "Ranger",
      "Warrior",
      "Sorceress",
      "Huntress",
      "Mercenary",
      "Monk",
      "Druid",
    ]);
    expect(options.map((option) => [option.id, option.rootClassId, option.nodeId])).toEqual([
      ["witch", "WITCH", "witch_start"],
      ["ranger", "RANGER", "ranger_start"],
      ["warrior", "MARAUDER", "marauder_start"],
      ["sorceress", "WITCH", "witch_start"],
      ["huntress", "RANGER", "ranger_start"],
      ["mercenary", "DUELIST", "duelist_start"],
      ["monk", "SIX", "six_start"],
      ["druid", "TEMPLAR", "templar_start"],
    ]);
  });

  it("falls back to graph class start names for fixtures or unknown graphs", () => {
    const graph = fixtureGraph({ Mercenary: "mercenary_start" });

    expect(buildClassStartOptions(graph)).toEqual([{
      id: "Mercenary",
      label: "Mercenary",
      className: "Mercenary",
      rootClassId: "Mercenary",
      nodeId: "mercenary_start",
    }]);
  });

  it("adds active ascendancy choices under their shared class start", () => {
    const graph = fixtureGraph(
      {
        DUELIST: "duelist_start",
      },
      {
        gemling_start: {
          id: "gemling_start",
          name: "Gambler",
          stats: [],
          position: { x: 1000, y: 1000 },
          flags: { classStart: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary3",
            name: "Gemling Legionnaire",
            className: "Mercenary",
            disabled: false,
            startNode: true,
          },
        },
      },
    );

    const options = buildClassStartOptions(graph);

    expect(options.map((option) => option.label)).toEqual([
      "Mercenary",
      "Mercenary - Gemling Legionnaire",
    ]);
    expect(options[1]).toMatchObject({
      id: "mercenary:Mercenary3",
      label: "Mercenary - Gemling Legionnaire",
      className: "Mercenary",
      rootClassId: "DUELIST",
      nodeId: "duelist_start",
      ascendancy: {
        id: "Mercenary3",
        name: "Gemling Legionnaire",
        startNodeId: "gemling_start",
      },
    });
  });
});

function fixtureGraph(
  classStarts: TreeGraph["classStarts"],
  extraNodes: TreeGraph["nodes"] = {},
): TreeGraph {
  return {
    schemaVersion: 1,
    gameVersion: "class-start-alias-test",
    extractedAt: "2026-05-27T00:00:00.000Z",
    source: { kind: "fixture", path: "src/tree/classStartAliases.test.ts" },
    nodes: {
      ...Object.fromEntries(Object.entries(classStarts).map(([classId, nodeId]) => [nodeId, {
        id: nodeId,
        name: classId,
        stats: ["Starting point"],
        position: { x: 0, y: 0 },
        flags: { classStart: true },
      }])),
      ...extraNodes,
    },
    groups: {},
    edges: [],
    classStarts,
    bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
  };
}
