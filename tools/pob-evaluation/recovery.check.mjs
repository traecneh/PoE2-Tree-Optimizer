import { test } from "node:test";
import assert from "node:assert/strict";
import { regenerationFromInputs } from "./recovery_checks.mjs";

const input = (changes = {}) => ({ pool: 1000, flat: 10, percent: 2, increased: 50, more: 1.2,
  disabled: false, unaffected: false, degenFlat: 0, degenPercent: 0, degenIncreased: 0, degenMore: 1,
  recoveryFlat: 0, recoveryRate: 1, overflow: 0, transferredToES: false, ...changes });

test("regen independently combines flat, pool percentage, increased and more factors", () => {
  assert.deepEqual(regenerationFromInputs(input()), { regeneration: 54, recovery: 54 });
  assert.deepEqual(regenerationFromInputs(input({ pool: 3054, flat: 0, percent: 4.03, increased: 20, more: 1 })), { regeneration: 147.7, recovery: 147.7 });
  assert.deepEqual(regenerationFromInputs(input({ pool: 3054, flat: 0, percent: 5.03, increased: 20, more: 1 })), { regeneration: 184.3, recovery: 184.3 });
});

test("regeneration rounds to tenths before adding other recovery", () => {
  assert.deepEqual(regenerationFromInputs(input({ pool: 0, flat: 1.26, increased: 0, more: 1, recoveryFlat: 0.02 })), { regeneration: 1.3, recovery: 1.32 });
});

test("degen, recovery rate and overflow are separate from regen", () => {
  assert.deepEqual(regenerationFromInputs(input({ degenFlat: 2, degenPercent: 1, degenIncreased: 50, degenMore: 2,
    recoveryFlat: 4, recoveryRate: 1.5, overflow: 3 })), { regeneration: 54, recovery: 27 });
});

test("disabled or unaffected regen is not confused with other recovery", () => {
  assert.deepEqual(regenerationFromInputs(input({ disabled: true, recoveryFlat: 4 })), { regeneration: 0, recovery: 4 });
  assert.deepEqual(regenerationFromInputs(input({ unaffected: true, recoveryFlat: 4 })), { regeneration: 54, recovery: 4 });
});

test("life-to-ES transfer zeros positive recovery but not degeneration", () => {
  assert.equal(regenerationFromInputs(input({ transferredToES: true })).recovery, 0);
  assert.equal(regenerationFromInputs(input({ transferredToES: true, degenFlat: 100 })).recovery, -46);
});

test("missing inputs, missing flags, invalid multipliers and overflow are not verified", () => {
  for (const changes of [{ more: undefined }, { pool: Infinity }, { disabled: undefined }, { pool: -1 },
    { more: -1 }, { recoveryRate: -1 }, { flat: Number.MAX_VALUE, more: 2 }]) {
    assert.equal(regenerationFromInputs(input(changes)), undefined);
  }
});
