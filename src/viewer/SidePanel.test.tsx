import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleGraph } from "../tree/sampleGraph";
import { SidePanel } from "./SidePanel";

describe("SidePanel", () => {
  it("renders search, build goals, and node inspector sections", () => {
    render(<SidePanel {...defaultProps()} />);

    expect(screen.getByLabelText("Passive search")).not.toBeNull();
    expect(screen.getByRole("region", { name: "Build goals" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Precise Shot" })).not.toBeNull();
    expect(screen.getByText("25% increased Critical Hit Chance")).not.toBeNull();
  });

  it("wires composed panel actions to their callbacks", () => {
    const props = defaultProps();
    render(<SidePanel {...props} />);

    fireEvent.click(within(screen.getByRole("region", { name: "Build goals" })).getByRole("button", { name: "Optimize route" }));
    fireEvent.click(screen.getByRole("button", { name: "Add build goal" }));

    expect(props.onOptimize).toHaveBeenCalled();
    expect(props.onAddBuildGoal).toHaveBeenCalledWith("precise_shot");
  });

  it("passes weapon-set mode context into the build goals panel", () => {
    render(<SidePanel {...defaultProps()} activeAllocationMode="weapon2" />);

    expect(screen.getByText("Weapon Set 2 mode is active.")).not.toBeNull();
    expect(screen.getByText("To add Weapon Set 2 passives, left-click eligible nodes directly on the tree.")).not.toBeNull();
  });
});

function defaultProps() {
  return {
    searchQuery: "",
    searchResults: [],
    selectedNodeId: "precise_shot",
    buildGoalNodeIds: new Set<string>(),
    onSearchQueryChange: vi.fn(),
    onSelectNode: vi.fn(),
    onHoverSearchNode: vi.fn(),
    canAddSearchBuildGoal: vi.fn(() => true),
    onAddBuildGoal: vi.fn(),
    canAddMatchingBuildGoal: vi.fn(() => true),
    onAddMatchingBuildGoals: vi.fn(),
    buildGoals: [{ node: sampleGraph.nodes.precise_shot, allocationDistance: 2, reached: false }],
    buildGoalStatus: { kind: "idle" as const },
    pobImportCode: "",
    pobImportStatus: { kind: "idle" as const },
    canApplyOptimizedRoute: false,
    routeCandidateSummaries: [],
    selectedRouteDetails: undefined,
    selectedRouteIndex: 0,
    activeAllocationMode: "main" as const,
    onPobImportCodeChange: vi.fn(),
    onImportPobBuildGoals: vi.fn(),
    onRemoveGoal: vi.fn(),
    onClearGoals: vi.fn(),
    onOptimize: vi.fn(),
    onCancel: vi.fn(),
    onApplyOptimizedRoute: vi.fn(),
    onSelectOptimizedRoute: vi.fn(),
    selectedNode: sampleGraph.nodes.precise_shot,
    visibleEdges: sampleGraph.edges,
    allocationPath: undefined,
    allocationPathNodeNames: [],
    pathStartName: "Mercenary",
    canAllocatePath: false,
    onAllocatePath: vi.fn(),
    canAddSelectedBuildGoal: true,
    isSelectedNodeBuildGoal: false,
  };
}
