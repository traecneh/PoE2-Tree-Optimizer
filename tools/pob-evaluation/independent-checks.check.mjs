import { test } from "node:test";
import assert from "node:assert/strict";
import { checkCalculations } from "./verify_results.mjs";

function example() {
  const baseline = { Str: 7, Dex: 7, Int: 15, Life: 100, Mana: 100, EnergyShield: 100, CombinedDPS: 1 };
  return {
    fixtures: {
      baseNodeId: "start", goalNodeIds: ["goal"],
      candidates: [{ label: "example", pointCost: 2, nodeIds: ["start", "travel", "goal"], edgeKeys: ["start::travel", "goal::travel"], nodes: [
        { id: "travel", stats: ["+5 to any Attribute"] },
        { id: "goal", stats: ["10% increased maximum Energy Shield"] },
      ] }],
    },
    results: {
      cases: [
        { id: "baseline", output: { Str: 7, Int: 15, Speed: 1, CombinedDPS: 1, damage: { PhysicalMinBase: 2, PhysicalMaxBase: 5 } } },
        { id: "strength", output: { Str: 17 } }, { id: "intelligence", output: { Int: 25 } },
        ...Object.entries({ "flat-es": 100, "increased-es": 120, "additive-es": 150, "more-es": 156, "flat-and-increased-es": 240 })
          .map(([id, EnergyShield]) => ({ id, output: { EnergyShield } })),
        { id: "attack-speed", output: { Speed: 2, CombinedDPS: 2 } },
        { id: "more-attack-damage", output: { CombinedDPS: 8 / 7, damage: { PhysicalStoredHitMin: 2, PhysicalStoredHitMax: 6 } } },
        { id: "damage-ranges", output: { damage: { LightningMinBase: 3, LightningMaxBase: 51 } } },
      ],
      routeBaseline: baseline, routeBaselineAfter: { ...baseline }, allocationUnchanged: true,
      routes: [{ label: "example", output: { Str: 12, Int: 15, EnergyShield: 110 } }],
    },
  };
}

test("accepts the controlled arithmetic and connected route", () => {
  const { fixtures, results } = example();
  assert.equal(checkCalculations(fixtures, results).passed, true);
});

test("rejects multiplying two increased-ES modifiers", () => {
  const { fixtures, results } = example();
  results.cases.find((entry) => entry.id === "additive-es").output.EnergyShield = 156;
  assert.equal(checkCalculations(fixtures, results).passed, false);
});

test("rejects a wrong damage-range maximum", () => {
  const { fixtures, results } = example();
  results.cases.find((entry) => entry.id === "damage-ranges").output.damage.LightningMaxBase = 56;
  assert.equal(checkCalculations(fixtures, results).passed, false);
});

test("catches missing attribute choices in the adapter", () => {
  const { fixtures, results } = example();
  results.routes[0].output.Str = 7;
  assert.equal(checkCalculations(fixtures, results).passed, false);
});

test("rejects a disconnected route even when its totals look correct", () => {
  const { fixtures, results } = example();
  fixtures.candidates[0].edgeKeys.pop();
  assert.equal(checkCalculations(fixtures, results).passed, false);
});

test("rejects an unreached mandatory goal", () => {
  const { fixtures, results } = example();
  fixtures.goalNodeIds.push("missing");
  assert.equal(checkCalculations(fixtures, results).passed, false);
});

test("counts a shared node once", () => {
  const { fixtures, results } = example();
  fixtures.candidates[0].nodeIds.push("travel");
  assert.equal(checkCalculations(fixtures, results).passed, true);
});

test("rejects a changed baseline after evaluating routes", () => {
  const { fixtures, results } = example();
  results.routeBaselineAfter.Mana = 101;
  assert.equal(checkCalculations(fixtures, results).passed, false);
});

test("never treats two missing baseline fields as verified", () => {
  const { fixtures, results } = example();
  delete results.routeBaseline.EnergyShield;
  delete results.routeBaselineAfter.EnergyShield;
  assert.equal(checkCalculations(fixtures, results).passed, false);
});
