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
});
