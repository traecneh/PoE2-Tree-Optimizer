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

  it("preserves missing node coordinates as non-finite values", () => {
    const graph = normalizePassiveTreePayload({
      gameVersion: "fixture-version",
      sourcePath: "fixture.json",
      payload: {
        nodes: {
          "100": {
            id: 100,
            dn: "Missing Coordinates",
            sd: [],
          },
        },
      },
    });

    expect(Number.isFinite(graph.nodes["100"].position.x)).toBe(false);
    expect(Number.isFinite(graph.nodes["100"].position.y)).toBe(false);
    expect(graph.bounds).toEqual({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
  });

  it("falls back to zero bounds for empty payloads", () => {
    const graph = normalizePassiveTreePayload({
      gameVersion: "fixture-version",
      sourcePath: "fixture.json",
      payload: {},
    });

    expect(graph.bounds).toEqual({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
  });
});
