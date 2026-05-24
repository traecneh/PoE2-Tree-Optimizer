import { describe, expect, it } from "vitest";
import { sampleGraph } from "../tree/sampleGraph";
import { buildFitViewBox } from "./treeViewBox";

describe("buildFitViewBox", () => {
  it("adds padding around graph bounds", () => {
    expect(buildFitViewBox(sampleGraph.bounds, 20)).toEqual("-20 -60 400 170");
  });
});
