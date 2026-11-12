import { describe, expect, it } from "vitest";
import { sampleGraph } from "../tree/sampleGraph";
import { buildFitViewBox, buildTreeFitBounds } from "./treeViewBox";

describe("buildFitViewBox", () => {
  it("adds padding around graph bounds", () => {
    expect(buildFitViewBox(sampleGraph.bounds, 20)).toEqual("-20 -60 400 170");
  });
  it("ignores outer ascendancies but includes the projected selected ascendancy", () => {
    const nodes = { ...sampleGraph.nodes,
      outer: { id: "outer", stats: [], flags: { ascendancy: true }, position: { x: 9000, y: -9000 },
        ascendancy: { id: "Other", name: "Other", className: "Test", disabled: false } },
      center: { id: "center", stats: [], flags: { ascendancy: true }, position: { x: 500, y: 300 },
        ascendancy: { id: "Selected", name: "Selected", className: "Test", disabled: false } },
    };
    expect(buildTreeFitBounds(nodes, undefined, sampleGraph.bounds)).toEqual(sampleGraph.bounds);
    expect(buildTreeFitBounds(nodes, "Selected", sampleGraph.bounds)).toEqual({ ...sampleGraph.bounds, maxX: 500, maxY: 300 });
  });
  it("uses fallback bounds for empty trees and trees with no main or selected nodes", () => {
    expect(buildTreeFitBounds({}, undefined, sampleGraph.bounds)).toEqual(sampleGraph.bounds);
    expect(buildTreeFitBounds({ only: { id: "only", stats: [], flags: { ascendancy: true }, position: { x: 0, y: 0 } } }, undefined, sampleGraph.bounds)).toEqual(sampleGraph.bounds);
  });
});
