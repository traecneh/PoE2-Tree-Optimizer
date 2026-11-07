import { describe, expect, it } from "vitest";
import { buildSummary } from "./buildSummary";
import type { TreeGraph } from "./types";

const fixtureGraph: TreeGraph = {
  schemaVersion: 1,
  gameVersion: "summary-fixture",
  extractedAt: "2026-05-26T00:00:00.000Z",
  source: { kind: "fixture", path: "src/tree/buildSummary.test.ts" },
  nodes: {
    start: {
      id: "start",
      name: "Start",
      stats: ["Starting point"],
      position: { x: 0, y: 0 },
      flags: { classStart: true },
    },
    strength_small: {
      id: "strength_small",
      name: "Strength Small",
      stats: ["+5 to Strength"],
      position: { x: 100, y: 0 },
      flags: { small: true },
    },
    strength_notable: {
      id: "strength_notable",
      name: "Strength Notable",
      stats: ["+10 to Strength"],
      position: { x: 200, y: 0 },
      flags: { notable: true },
    },
    projectile_small: {
      id: "projectile_small",
      name: "Projectile Small",
      stats: ["12% increased Projectile Damage"],
      position: { x: 300, y: 0 },
      flags: { small: true },
    },
    projectile_notable: {
      id: "projectile_notable",
      name: "Projectile Notable",
      stats: ["8% increased Projectile Damage", "0.5% of maximum Life Regenerated per second"],
      position: { x: 400, y: 0 },
      flags: { notable: true },
    },
    recovery_notable: {
      id: "recovery_notable",
      name: "Recovery Notable",
      stats: ["0.5% of maximum Life Regenerated per second"],
      position: { x: 500, y: 0 },
      flags: { notable: true },
    },
    minion_notable: {
      id: "minion_notable",
      name: "Minion Notable",
      stats: ["Minions deal 10% increased Damage", "Cannot be Stunned"],
      position: { x: 600, y: 0 },
      flags: { notable: true },
    },
    minion_speed_small: {
      id: "minion_speed_small",
      name: "Minion Speed Small",
      stats: ["Minions have 3% increased Attack Speed"],
      position: { x: 650, y: 0 },
      flags: { small: true },
    },
    minion_speed_notable: {
      id: "minion_speed_notable",
      name: "Minion Speed Notable",
      stats: ["Minions have 3% increased Attack Speed"],
      position: { x: 675, y: 0 },
      flags: { notable: true },
    },
    stun_notable: {
      id: "stun_notable",
      name: "Stun Notable",
      stats: ["Cannot be Stunned"],
      position: { x: 700, y: 0 },
      flags: { notable: true },
    },
    generic_damage: {
      id: "generic_damage",
      name: "Generic Damage",
      stats: ["10% increased Damage"],
      position: { x: 800, y: 0 },
      flags: { notable: true },
    },
  },
  groups: {},
  edges: [],
  classStarts: { Test: "start" },
  bounds: { minX: 0, maxX: 800, minY: 0, maxY: 0 },
};

function graphWithEffects(effects: Record<string, string[]>): TreeGraph {
  return {
    ...fixtureGraph,
    nodes: Object.fromEntries(Object.entries(effects).map(([id, stats]) => [id, {
      id,
      name: id,
      stats,
      position: { x: 0, y: 0 },
      flags: { small: true },
    }])),
  };
}

describe("buildSummary", () => {
  it("counts visible allocated passives without counting the class start", () => {
    const summary = buildSummary(fixtureGraph, ["start", "strength_small", "projectile_small"]);

    expect(summary.nodeCount).toBe(3);
    expect(summary.pointCount).toBe(2);
  });

  it("allows specific visible nodes to contribute no allocated point cost", () => {
    const summary = buildSummary(
      fixtureGraph,
      ["strength_notable", "projectile_notable"],
      { pointCostByNodeId: new Map([["projectile_notable", 0]]) },
    );

    expect(summary.nodeCount).toBe(2);
    expect(summary.pointCount).toBe(1);
  });

  it("sums matching leading numeric stats by unit and trailing wording", () => {
    const summary = buildSummary(fixtureGraph, [
      "start",
      "strength_small",
      "strength_notable",
      "projectile_small",
      "projectile_notable",
      "recovery_notable",
    ]);

    expect(summary.summedStats.map((stat) => stat.text)).toEqual([
      "+15 to Strength",
      "20% increased Projectile Damage",
      "1% of maximum Life Regenerated per second",
    ]);
  });

  it("does not merge semantically different stat wording", () => {
    const summary = buildSummary(fixtureGraph, ["minion_notable", "generic_damage"]);

    expect(summary.summedStats.map((stat) => stat.text)).toEqual([
      "Minions deal 10% increased Damage",
      "10% increased Damage",
    ]);
  });

  it("sums matching numeric values embedded in otherwise identical effects", () => {
    const summary = buildSummary(fixtureGraph, ["minion_speed_small", "minion_speed_notable"]);

    expect(summary.summedStats).toContainEqual({
      key: "%:minions have <> increased attack speed",
      label: "increased Attack Speed",
      value: 6,
      formattedValue: "6",
      unit: "%",
      text: "Minions have 6% increased Attack Speed",
      sourceNodeIds: ["minion_speed_small", "minion_speed_notable"],
      sourceNodeNames: ["Minion Speed Small", "Minion Speed Notable"],
    });
    expect(summary.otherStats.map((stat) => stat.text)).not.toContain("Minions have 3% increased Attack Speed");
  });

  it("keeps repeated non-numeric effects grouped separately", () => {
    const summary = buildSummary(fixtureGraph, ["minion_notable", "stun_notable"]);

    expect(summary.otherStats).toEqual([
      {
        text: "Cannot be Stunned",
        count: 2,
        sourceNodeIds: ["minion_notable", "stun_notable"],
        sourceNodeNames: ["Minion Notable", "Stun Notable"],
      },
    ]);
  });

  it("combines matching damage ranges into totals with their source nodes", () => {
    const graph = graphWithEffects({
      "Lightning Small A": ["Adds 1 to 7 Lightning damage to Attacks"],
      "Lightning Small B": ["Adds 1 to 7 Lightning damage to Attacks"],
    });
    const summary = buildSummary(graph, Object.keys(graph.nodes));

    expect(summary.summedStats).toEqual([{
      key: "damage-range:lightning damage to attacks",
      label: "Lightning damage to Attacks",
      minimum: 2,
      maximum: 14,
      text: "Adds 2 to 14 Lightning damage to Attacks",
      sourceNodeIds: ["Lightning Small A", "Lightning Small B"],
      sourceNodeNames: ["Lightning Small A", "Lightning Small B"],
    }]);
    expect(summary.otherStats).toEqual([]);
  });

  it("adds differing ranges and counts each allocated node only once", () => {
    const graph = graphWithEffects({
      smallA: ["Adds 1 to 7 Lightning damage to Attacks"],
      smallB: ["Adds 1 to 7 Lightning damage to Attacks"],
      notable: ["Adds 1 to 37 Lightning damage to Attacks"],
    });
    const summary = buildSummary(graph, ["smallA", "smallB", "notable", "smallA", "notable"]);

    expect(summary.pointCount).toBe(3);
    expect(summary.summedStats.map((stat) => stat.text)).toEqual(["Adds 3 to 51 Lightning damage to Attacks"]);
    expect(summary.summedStats[0].sourceNodeIds).toEqual(["smallA", "smallB", "notable"]);
  });

  it("keeps damage types and attack, spell, and unspecified scopes separate", () => {
    const effects = [
      "Adds 1 to 7 Lightning damage to Attacks",
      "Adds 1 to 7 Fire damage to Attacks",
      "Adds 1 to 7 Cold damage to Attacks",
      "Adds 1 to 7 Physical damage to Attacks",
      "Adds 1 to 7 Chaos damage to Attacks",
      "Adds 1 to 7 Lightning damage to Spells",
      "Adds 1 to 7 Lightning damage to Attacks and Spells",
      "Adds 1 to 7 Lightning damage",
    ];
    const graph = graphWithEffects({ damage: effects });
    const summary = buildSummary(graph, ["damage"]);

    expect(summary.summedStats.map((stat) => stat.text)).toEqual(effects);
    expect(summary.otherStats).toEqual([]);
  });

  it("normalizes damage range whitespace and case while preserving first-source wording", () => {
    const graph = graphWithEffects({
      a: ["  Adds 1 to 7 Lightning damage to Attacks  "],
      b: ["adds 2 to 8 lightning DAMAGE to attacks"],
    });

    expect(buildSummary(graph, ["a", "b"]).summedStats.map((stat) => stat.text)).toEqual([
      "Adds 3 to 15 Lightning damage to Attacks",
    ]);
  });

  it("handles zero and decimal damage bounds without floating-point display noise", () => {
    const graph = graphWithEffects({
      a: ["Adds 0 to 0.1 Fire damage to Spells"],
      b: ["Adds 0.1 to 0.2 Fire damage to Spells"],
      c: ["Adds 0.2 to 0.3 Fire damage to Spells"],
    });

    expect(buildSummary(graph, ["a", "b", "c"]).summedStats.map((stat) => stat.text)).toEqual([
      "Adds 0.3 to 0.6 Fire damage to Spells",
    ]);
  });

  it("does not guess at conditional, scaling, multi-effect, or invalid ranges", () => {
    const effects = [
      "Adds 1 to 7 Lightning damage to Attacks while on Full Life",
      "Adds 1 to 7 Lightning damage to Attacks per 10 Intelligence",
      "Minions deal 1 to 7 additional Lightning damage",
      "Adds 1 to 7 Lightning damage and 2 to 8 Fire damage to Attacks",
      "Adds 7 to 1 Lightning damage to Attacks",
      "Adds -1 to 7 Lightning damage to Attacks",
      "Adds 1% to 7% Lightning damage to Attacks",
    ];
    const graph = graphWithEffects({ a: effects, b: effects });
    const summary = buildSummary(graph, ["a", "b"]);

    expect(summary.summedStats).toEqual([]);
    expect(summary.otherStats.map(({ text, count }) => ({ text, count }))).toEqual(
      effects.map((text) => ({ text, count: 2 })),
    );
  });
});
