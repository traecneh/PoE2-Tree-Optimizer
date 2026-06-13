import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleGraph } from "../tree/sampleGraph";
import { TreeViewerPanel } from "./TreeViewerPanel";

describe("TreeViewerPanel", () => {
  it("marks the viewer busy and shows loading copy while graph data is loading", () => {
    render(<TreeViewerPanel {...defaultProps({ graphLoadStatus: "loading" })} />);

    const region = screen.getByRole("region", { name: "Passive tree viewer" });
    expect(region.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByText("Loading passive tree...")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Mercenary" })).not.toBeNull();
  });

  it("forwards node selection to the tree viewer", () => {
    const props = defaultProps({ graphLoadStatus: "loaded" });
    render(<TreeViewerPanel {...props} />);

    const region = screen.getByRole("region", { name: "Passive tree viewer" });
    expect(region.getAttribute("aria-busy")).toBe("false");

    fireEvent.pointerDown(screen.getByRole("button", { name: "Precise Shot" }), {
      clientX: 0,
      clientY: 0,
      button: 0,
      pointerId: 1,
    });
    fireEvent.pointerUp(screen.getByRole("button", { name: "Precise Shot" }), {
      clientX: 0,
      clientY: 0,
      button: 0,
      pointerId: 1,
    });

    expect(props.onSelectNode).toHaveBeenCalledWith("precise_shot");
  });
});

function defaultProps(overrides: Partial<Parameters<typeof TreeViewerPanel>[0]> = {}) {
  return {
    graph: sampleGraph,
    graphLoadStatus: "loaded" as const,
    selectedNodeId: undefined,
    pathStartNodeId: "mercenary_start",
    pathStartClassName: "Mercenary",
    activeAscendancyId: undefined,
    noAllocationPathNodeId: undefined,
    nodeVisualScale: 1,
    searchMatchNodeIds: new Set<string>(),
    searchFocusedNodeId: undefined,
    buildGoalNodeIds: new Set<string>(),
    activeAllocationMode: "main" as const,
    weaponSet1NodeIds: new Set<string>(),
    weaponSet2NodeIds: new Set<string>(),
    weaponSet1EdgeKeys: new Set<string>(),
    weaponSet2EdgeKeys: new Set<string>(),
    allocatedNodeIds: new Set<string>(),
    allocatedEdgeKeys: new Set<string>(),
    allocationPathNodeIds: new Set<string>(),
    allocationPathEdgeKeys: new Set<string>(),
    hoverAllocationPathNodeIds: new Set<string>(),
    hoverAllocationPathEdgeKeys: new Set<string>(),
    onSelectNode: vi.fn(),
    onAddBuildGoal: vi.fn(),
    onHoverNode: vi.fn(),
    ...overrides,
  };
}
