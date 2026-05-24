import { describe, expect, it } from "vitest";
import { normalizePassiveTreePayload } from "./normalize";

describe("normalizePassiveTreePayload", () => {
  it("normalizes an official-json-like passive tree payload", () => {
    const graph = normalizePassiveTreePayload({
      gameVersion: "fixture-version",
      sourcePath: "fixture.json",
      payload: {
        groups: {
          "1": { x: 10, y: 20, n: ["100", "101"] },
        },
        nodes: {
          "100": {
            id: 100,
            g: 1,
            dn: "Start",
            sd: ["Starting point"],
            x: 10,
            y: 20,
            out: ["101"],
            isAscendancyStart: false,
            isMultipleChoice: false,
            isJewelSocket: false,
            isKeystone: false,
            isNotable: false,
            isClassStart: true,
          },
          "101": {
            id: 101,
            g: 1,
            dn: "Critical Strike Chance",
            sd: ["15% increased Critical Hit Chance"],
            x: 90,
            y: 20,
            out: [],
            isJewelSocket: false,
            isKeystone: false,
            isNotable: true,
          },
        },
        classes: { Mercenary: { startNodeId: "100" } },
      },
    });

    expect(graph.nodes["100"].flags.classStart).toBe(true);
    expect(graph.nodes["101"].flags.notable).toBe(true);
    expect(graph.edges).toEqual([{ from: "100", to: "101" }]);
    expect(graph.bounds).toEqual({ minX: 10, maxX: 90, minY: 20, maxY: 20 });
  });
});
