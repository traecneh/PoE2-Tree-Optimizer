import { describe, expect, it } from "vitest";
import type { TreeEdge } from "../tree/types";
import type { TreeGroup, TreeNode } from "../tree/types";
import { buildTreeEdgePath } from "./treeEdgePath";

describe("buildTreeEdgePath", () => {
  const group: TreeGroup = {
    id: "g1",
    position: { x: 0, y: 0 },
    nodeIds: ["east", "south"],
  };

  it("uses a circular arc for nodes on the same group orbit", () => {
    expect(buildTreeEdgePath(node("east", 100, 0), node("south", 0, 100), group)).toBe(
      "M 100 0 A 100 100 0 0 1 0 100",
    );
  });

  it("uses the game connection orbit as a routed arc radius", () => {
    expect(buildTreeEdgePath(node("a", 0, 0), node("b", 100, 0), undefined, edge("a", "b", 1))).toBe(
      "M 0 0 A 82 82 0 0 1 100 0",
    );
  });

  it("uses the game connection orbit sign to choose the other routed arc side", () => {
    expect(buildTreeEdgePath(node("a", 0, 0), node("b", 100, 0), undefined, edge("a", "b", -1))).toBe(
      "M 0 0 A 82 82 0 0 0 100 0",
    );
  });

  it("uses a straight segment for nodes on different radii", () => {
    expect(buildTreeEdgePath(node("east", 100, 0), node("inner", 0, 50), group)).toBe("M 100 0 L 0 50");
  });

  it("uses a straight segment when there is no group center", () => {
    expect(buildTreeEdgePath(node("a", 10, 20), node("b", 30, 40), undefined)).toBe("M 10 20 L 30 40");
  });
});

function node(id: string, x: number, y: number): TreeNode {
  return {
    id,
    groupId: "g1",
    stats: [],
    position: { x, y },
    flags: { small: true },
  };
}

function edge(from: string, to: string, connectionOrbit: number): TreeEdge {
  return { from, to, connectionOrbit };
}
