import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { inventoryGameData } from "./inventory";

describe("inventoryGameData", () => {
  it("finds Content.ggpk and passive-like files", () => {
    const root = mkdtempSync(join(tmpdir(), "poe2-inventory-"));
    mkdirSync(join(root, "Data"), { recursive: true });
    writeFileSync(join(root, "Content.ggpk"), "");
    writeFileSync(join(root, "Data", "passive_skill_trees.json"), "{}");

    const inventory = inventoryGameData(root);

    expect(inventory.contentGgpk.exists).toBe(true);
    expect(inventory.passiveCandidates.map((candidate) => candidate.relativePath)).toContain(join("Data", "passive_skill_trees.json"));
  });
});
