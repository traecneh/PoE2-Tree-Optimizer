import { describe, expect, it } from "vitest";
import { publicAssetPath } from "./publicAssetPaths";

describe("public asset paths", () => {
  it("keeps root-hosted assets rooted at slash", () => {
    expect(publicAssetPath("tree-graph.json", "/")).toBe("/tree-graph.json");
    expect(publicAssetPath("/tree-assets/icons/node.png", "/")).toBe("/tree-assets/icons/node.png");
  });

  it("prefixes assets with the GitHub Pages project base", () => {
    expect(publicAssetPath("tree-graph.json", "/PoE2-Tree-Optimizer/")).toBe(
      "/PoE2-Tree-Optimizer/tree-graph.json",
    );
    expect(publicAssetPath("/tree-assets/icons/node.png", "/PoE2-Tree-Optimizer/")).toBe(
      "/PoE2-Tree-Optimizer/tree-assets/icons/node.png",
    );
  });
});
