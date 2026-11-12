import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { prepareData } from "./prepare-data.mjs";

const folders = [];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "poe-preparation-")); folders.push(root);
  mkdirSync(join(root, "data/tree-assets"), { recursive: true });
  writeFileSync(join(root, "data/tree-graph.json"), JSON.stringify({ nodes: { start: {} }, classStarts: { witch: "start" } }));
  writeFileSync(join(root, "data/tree-assets/icon.txt"), "source image");
  return root;
}
afterEach(() => { for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true }); });
describe("data preparation", () => {
  it("prepares graph-only tests without requiring or replacing image files", () => {
    const root = fixture();
    mkdirSync(join(root, "public/tree-assets"), { recursive: true });
    writeFileSync(join(root, "public/tree-assets/existing.txt"), "preserve me");
    rmSync(join(root, "data/tree-assets"), { recursive: true });
    prepareData(root, { graphOnly: true });
    expect(existsSync(join(root, "public/tree-graph.json"))).toBe(true);
    expect(readFileSync(join(root, "public/tree-assets/existing.txt"), "utf8")).toBe("preserve me");
  });
  it("keeps full asset preparation for dev/build and removes obsolete generated images", () => {
    const root = fixture();
    mkdirSync(join(root, "public/tree-assets"), { recursive: true });
    writeFileSync(join(root, "public/tree-assets/stale.txt"), "stale");
    prepareData(root);
    expect(readFileSync(join(root, "public/tree-assets/icon.txt"), "utf8")).toBe("source image");
    expect(existsSync(join(root, "public/tree-assets/stale.txt"))).toBe(false);
  });
  it.each(["{}", "bad JSON"])("does not overwrite usable public data on invalid source %s", (source) => {
    const root = fixture();
    prepareData(root);
    const original = readFileSync(join(root, "public/tree-graph.json"), "utf8");
    writeFileSync(join(root, "data/tree-graph.json"), source);
    expect(() => prepareData(root, { graphOnly: true })).toThrow();
    expect(readFileSync(join(root, "public/tree-graph.json"), "utf8")).toBe(original);
    expect(existsSync(join(root, "public/tree-assets/icon.txt"))).toBe(true);
  });
  it("fails clearly when no source or fallback exists", () => {
    const root = fixture();
    rmSync(join(root, "data/tree-graph.json"));
    expect(() => prepareData(root, { graphOnly: true })).toThrow("Missing deploy data");
  });
});
