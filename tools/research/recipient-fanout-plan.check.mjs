import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { tsImport } from "tsx/esm/api";
const { enumerateRecipientAlternatives: enumerate, loadFanoutReview, reviewedRewards, digest } = await tsImport("./recipient-fanout-test-context.ts", import.meta.url);
const fixture = () => ({ nodeIds: ["0", "1", "10", "11", "20", "21", "30", "31"], rootNodeId: "0", edges: [["0", "1"], ["0", "10"], ["10", "11"], ["0", "20"], ["20", "21"], ["1", "30"], ["30", "31"]],
  incumbentNodeIds: ["0", "1", "10", "11"], protectedNodeIds: ["0", "1"], eligibleNodeIds: ["10", "11", "20", "21", "30", "31"], pointLimit: 3 });
const donor = { donorAnchorNodeId: "0", donorNodeIds: ["10", "11"] };

test("enumerates all recipient alternatives instead of stopping at the first", () => {
  const result = enumerate(fixture(), donor); assert.deepEqual(result.domains.map((d) => d.recipientNodeIds), [["20", "21"], ["30", "31"]]);
  assert.equal(result.componentCount, 2); assert.equal(result.boundedWithSelectedAttachment, 2); assert.deepEqual(result.rejected, []);
  for (const d of result.domains) assert.deepEqual(d.witnesses.map((w) => [w.donorPoints, w.recipientPoints]), [[2, 0], [1, 1], [0, 2]]);
});

test("keeps a fixed donor and reports donor-dependent recipients rather than silently skipping them", () => {
  const input = fixture(); input.edges = input.edges.map(([a, b]) => a === "0" && b === "20" ? ["11", "20"] : [a, b]);
  const result = enumerate(input, donor); assert.equal(result.domains.length, 1); assert.equal(result.boundedWithSelectedAttachment, 2);
  assert.ok(result.rejected.some((r) => r.firstNodeId === "20" && r.reason.includes("donor")));
});

test("rejects complete oversized, singleton and unattached components without clipping", () => {
  const input = fixture();
  for (let id = 22; id <= 28; id += 1) { input.nodeIds.push(String(id)); input.eligibleNodeIds.push(String(id)); input.edges.push([String(id - 1), String(id)]); }
  input.nodeIds.push("40", "50", "51"); input.eligibleNodeIds.push("40", "50", "51"); input.edges.push(["0", "40"], ["50", "51"]);
  const result = enumerate(input, donor); assert.equal(result.componentCount, 4); assert.deepEqual(result.domains.map((d) => d.recipientNodeIds), [["30", "31"]]);
  assert.ok(result.rejected.some((r) => r.size === 9 && r.reason.includes("not clipped"))); assert.ok(result.rejected.some((r) => r.size === 1));
  assert.ok(result.rejected.some((r) => r.firstNodeId === "50" && r.reason.includes("attachment")));
});

test("a frozen donor cannot omit descendants, include protected nodes or change the point allowance", () => {
  const input = fixture(); input.nodeIds.push("12"); input.incumbentNodeIds.push("12"); input.eligibleNodeIds.push("12"); input.edges.push(["11", "12"]); input.pointLimit = 4;
  assert.throws(() => enumerate(input, donor), /descendants/);
  const protectedInput = fixture(); protectedInput.protectedNodeIds.push("11"); assert.throws(() => enumerate(protectedInput, donor), /optional/);
  const over = fixture(); over.pointLimit = 4; assert.throws(() => enumerate(over, donor), /full-budget/);
});

test("selection is deterministic, immutable and independent of rewards and source ordering", () => {
  const input = fixture(), before = JSON.stringify(input), expected = enumerate(input, donor), reverse = structuredClone(input);
  for (const key of ["nodeIds", "edges", "incumbentNodeIds", "protectedNodeIds", "eligibleNodeIds"]) reverse[key].reverse();
  Object.defineProperty(reverse, "rewards", { get() { throw new Error("Reward read"); } }); Object.defineProperty(reverse, "stats", { get() { throw new Error("Stat read"); } });
  assert.deepEqual(enumerate(reverse, donor), expected); assert.equal(JSON.stringify(input), before);
});

test("invalid identifiers and unknown links fail, while duplicate/self links are neutral", () => {
  const input = fixture(), expected = enumerate(input, donor); input.edges.push(["0", "0"], ["0", "10"]); assert.deepEqual(enumerate(input, donor), expected);
  input.edges.push(["0", "absent"]); assert.throws(() => enumerate(input, donor));
  const duplicate = fixture(); duplicate.nodeIds.push("0"); assert.throws(() => enumerate(duplicate, donor));
});

test("the frozen batch covers all four donor fanouts and records every structural exclusion", () => {
  const plan = JSON.parse(readFileSync("var/exact-recipient-fanout-20261108/plan.json", "utf8"));
  const parent = JSON.parse(readFileSync(plan.parentPlanPath, "utf8")); assert.equal(digest(readFileSync(plan.parentPlanPath)), plan.parentPlanSha256);
  assert.deepEqual(plan.entries.map((e) => e.alternatives.domains.length), [76, 64, 61, 51]);
  for (const entry of plan.entries) {
    const source = parent.entries.find((e) => e.id === entry.id);
    assert.deepEqual(entry.donor.donorNodeIds, source.selection.domain.donorNodeIds);
    assert.deepEqual(enumerate(source.topology, entry.donor), entry.alternatives);
    assert.equal(entry.alternatives.componentCount, entry.alternatives.domains.length + entry.alternatives.rejected.length);
    assert.ok(entry.alternatives.domains.some((d) => JSON.stringify(d.recipientNodeIds) === JSON.stringify(source.selection.domain.recipientNodeIds)));
  }
});

test("526 post-freeze review additions are explicit, unique and contain signed/owner-aware arithmetic", () => {
  const review = loadFanoutReview(), data = JSON.parse(readFileSync("var/exact-recipient-fanout-20261108/review-input.json", "utf8"));
  const additions = JSON.parse(readFileSync("tools/research/recipient-fanout-reward-additions.json", "utf8"));
  assert.equal(data.unreviewed.length, 526); assert.equal(additions.valued.length, 12);
  const all = [...review.valued.map((r) => r.text), ...review.zeroGroups.flatMap((g) => g.texts)];
  assert.equal(new Set(all).size, all.length); assert.equal(all.length, 585); assert.ok(data.stats.every((text) => all.includes(text)));
  const added = [...additions.valued.map((r) => r.text), ...additions.zeroGroups.flatMap((g) => g.texts)]; assert.deepEqual([...added].sort(), [...data.unreviewed].sort());
  const fake = (stats) => ({ nodes: { n: { name: "Literal", stats } } }), reward = (family, stats) => reviewedRewards({ family, variableNodeIds: ["n"] }, fake(stats), review).rewardUnits.n;
  assert.equal(reward("chaos-dot", ["10% increased Skill Effect Duration", "16% reduced Skill Effect Duration"]), -36);
  assert.equal(reward("warbringer-partial", ["25% increased Armour", "25% increased Armour if you've Hit an Enemy with a Melee Attack Recently"]), 125);
  assert.equal(reward("spectres", ["Minions deal 16% increased Damage", "Minions have 3% increased Attack Speed"]), 252);
  assert.equal(reward("wolfpack", ["Minions deal 16% increased Damage", "Minions have 3% increased Attack Speed", "Companions deal 12% increased Damage"]), 240);
  assert.equal(reward("chaos-dot", ["Enemies you Curse have -3% to Chaos Resistance"]), 0);
  assert.throws(() => reward("spectres", ["Future unreviewed effect"]), /Unreviewed/);
});
