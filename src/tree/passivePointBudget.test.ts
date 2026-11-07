import { describe, expect, it } from "vitest";
import { countMainPassivePoints, normalizeMainPointLimit } from "./passivePointBudget";
import { sampleGraph } from "./sampleGraph";

describe("main passive point budget", () => {
  it("counts unique main nodes without class starts, ascendancy or missing nodes", () => {
    const graph = { ...sampleGraph, nodes: { ...sampleGraph.nodes,
      ascendancy: { ...sampleGraph.nodes.precise_shot, id: "ascendancy", flags: { ascendancy: true } },
    } };
    expect(countMainPassivePoints(graph, ["mercenary_start", "projectile_damage", "projectile_damage", "precise_shot", "ascendancy", "missing"])).toBe(2);
  });
  it("validates available main limits, including zero after reservations", () => {
    expect(normalizeMainPointLimit(undefined)).toBe(123);
    expect(normalizeMainPointLimit(Infinity)).toBe(123);
    expect(normalizeMainPointLimit(99)).toBe(99);
    expect(normalizeMainPointLimit(-5)).toBe(0);
    expect(normalizeMainPointLimit(200)).toBe(123);
  });
});
