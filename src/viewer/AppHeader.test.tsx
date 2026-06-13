import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ClassStartOption } from "../tree/classStartAliases";
import type { SavedBuild } from "../tree/savedBuilds";
import { AppHeader } from "./AppHeader";

describe("AppHeader", () => {
  it("renders the build, tree setup, and allocation control groups", () => {
    render(<AppHeader {...defaultProps()} />);

    expect(screen.getByRole("heading", { name: "PoE2 Tree Optimizer for Boomslang" })).not.toBeNull();
    expect(screen.getByText("Tree data: PoE2 0.5.0")).not.toBeNull();
    const siteHelpText = screen.getByRole("tooltip", { name: "Site usage help" }).textContent;
    expect(siteHelpText).toContain("Ctrl + left click");
    expect(siteHelpText).toContain("Mode: Main edits the normal passive tree and is used by Build goals and Optimize route.");
    expect(siteHelpText).toContain("Mode: W1 and W2 edit weapon-set-specific passives manually; select W1 or W2, then left-click eligible nodes on the tree.");

    const buildGroup = screen.getByRole("group", { name: "Build management" });
    expect(within(buildGroup).getByLabelText("Saved build")).not.toBeNull();
    expect(within(buildGroup).getByLabelText("Build name")).not.toBeNull();
    expect(within(buildGroup).getByRole("button", { name: "New build" })).not.toBeNull();
    expect(within(buildGroup).getByRole("button", { name: "Export builds" })).not.toBeNull();
    expect(within(buildGroup).getByRole("button", { name: "Import builds" })).not.toBeNull();

    const treeSetupGroup = screen.getByRole("group", { name: "Tree setup" });
    expect(within(treeSetupGroup).getByLabelText("Path start")).not.toBeNull();
    expect(within(treeSetupGroup).getByLabelText("Node size")).not.toBeNull();
    expect(within(treeSetupGroup).getByRole("button", { name: "Main allocation mode" })).not.toBeNull();
    expect(within(treeSetupGroup).getByRole("button", { name: "Weapon Set 1 allocation mode" })).not.toBeNull();
    expect(within(treeSetupGroup).getByRole("button", { name: "Weapon Set 2 allocation mode" })).not.toBeNull();
    expect(within(treeSetupGroup).getByLabelText("Hover path preview")).not.toBeNull();

    const allocationGroup = screen.getByRole("group", { name: "Allocation summary" });
    expect(within(allocationGroup).getByText("Allocated 4/123")).not.toBeNull();
    expect(within(allocationGroup).getByText("Main 4/123")).not.toBeNull();
    expect(within(allocationGroup).getByText("W1 1/24 · W2 2/24")).not.toBeNull();
    expect(within(allocationGroup).getByText("Ascendancy 2/8")).not.toBeNull();
  });

  it("wires header controls to their callbacks", () => {
    const props = defaultProps();
    render(<AppHeader {...props} />);

    fireEvent.change(screen.getByLabelText("Saved build"), { target: { value: "saved-1" } });
    fireEvent.change(screen.getByLabelText("Build name"), { target: { value: "Updated build" } });
    fireEvent.click(screen.getByRole("button", { name: "New build" }));
    fireEvent.click(screen.getByRole("button", { name: "Save build" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete build" }));
    fireEvent.click(screen.getByRole("button", { name: "Export builds" }));
    const importFile = new File(["{}"], "builds.json", { type: "application/json" });
    fireEvent.change(screen.getByLabelText("Import builds file"), { target: { files: [importFile] } });
    fireEvent.change(screen.getByLabelText("Path start"), { target: { value: "witch" } });
    fireEvent.change(screen.getByLabelText("Node size"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Weapon Set 1 allocation mode" }));
    fireEvent.click(screen.getByLabelText("Hover path preview"));
    fireEvent.click(screen.getByRole("button", { name: "Reset allocation" }));

    expect(props.onLoadSavedBuild).toHaveBeenCalledWith("saved-1");
    expect(props.onSavedBuildNameChange).toHaveBeenCalledWith("Updated build");
    expect(props.onNewUnsavedBuild).toHaveBeenCalled();
    expect(props.onSaveCurrentBuild).toHaveBeenCalled();
    expect(props.onDeleteSelectedBuild).toHaveBeenCalled();
    expect(props.onExportSavedBuilds).toHaveBeenCalled();
    expect(props.onImportSavedBuildsFile).toHaveBeenCalledWith(importFile);
    expect(props.onChangeSelectedClassStart).toHaveBeenCalledWith("witch");
    expect(props.onNodeVisualScaleChange).toHaveBeenCalledWith(2);
    expect(props.onChangeActiveAllocationMode).toHaveBeenCalledWith("weapon1");
    expect(props.onToggleHoverPathPreview).toHaveBeenCalledWith(false);
    expect(props.onResetAllocation).toHaveBeenCalled();
  });

  it("marks saved builds that keep an optimized route choice", () => {
    render(<AppHeader
      {...defaultProps()}
      savedBuilds={[
        fixtureSavedBuild({ id: "manual", name: "Manual build" }),
        fixtureSavedBuild({
          id: "optimized",
          name: "Optimized build",
          optimizedRouteChoice: {
            routeIndex: 2,
            routeNumber: 3,
            routeCount: 4,
            pointCost: 42,
            pointDeltaFromBest: 1,
            pointCostRouteNumber: 1,
            pointCostRouteCount: 2,
          },
        }),
      ]}
      selectedSavedBuildId="optimized"
    />);

    const savedBuildSelect = screen.getByLabelText("Saved build") as HTMLSelectElement;
    expect(Array.from(savedBuildSelect.options).map((option) => option.textContent)).toEqual([
      "Unsaved build",
      "Manual build",
      "Optimized build - optimized route",
    ]);
    expect(screen.getByText("Saved optimized route: route 3 of 4, 42 points, +1 vs best.")).not.toBeNull();
  });
});

function defaultProps() {
  return {
    treeDataVersionLabel: "PoE2 0.5.0",
    savedBuilds: [fixtureSavedBuild()],
    selectedSavedBuildId: "",
    savedBuildName: "Test build",
    savedBuildStatus: "Saved Test build",
    savedBuildStatusFeedbackKey: 1,
    canSaveCurrentBuild: true,
    canDeleteSelectedBuild: true,
    canExportSavedBuilds: true,
    classStartOptions: fixtureClassStartOptions(),
    selectedClassStartId: "mercenary",
    nodeVisualScale: 3,
    nodeVisualScaleOptions: [1, 2, 3],
    activeAllocationMode: "main" as const,
    hoverPathPreviewEnabled: true,
    allocatedPointCount: 4,
    mainPassivePointCount: 4,
    weaponSet1PointCount: 1,
    weaponSet2PointCount: 2,
    activeAscendancyPointCount: 2,
    hasSelectedAscendancy: true,
    canResetAllocation: true,
    onLoadSavedBuild: vi.fn(),
    onSavedBuildNameChange: vi.fn(),
    onNewUnsavedBuild: vi.fn(),
    onSaveCurrentBuild: vi.fn(),
    onDeleteSelectedBuild: vi.fn(),
    onExportSavedBuilds: vi.fn(),
    onImportSavedBuildsFile: vi.fn(),
    onChangeSelectedClassStart: vi.fn(),
    onNodeVisualScaleChange: vi.fn(),
    onChangeActiveAllocationMode: vi.fn(),
    onToggleHoverPathPreview: vi.fn(),
    onResetAllocation: vi.fn(),
  };
}

function fixtureClassStartOptions(): ClassStartOption[] {
  return [
    {
      id: "mercenary",
      label: "Mercenary",
      className: "Mercenary",
      rootClassId: "DUELIST",
      nodeId: "mercenary_start",
    },
    {
      id: "witch",
      label: "Witch",
      className: "Witch",
      rootClassId: "WITCH",
      nodeId: "witch_start",
    },
  ];
}

function fixtureSavedBuild(overrides: Partial<{
  id: string;
  name: string;
  optimizedRouteChoice: SavedBuild["state"]["optimizedRouteChoice"];
}> = {}): SavedBuild {
  return {
    id: overrides.id ?? "saved-1",
    name: overrides.name ?? "Saved build",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    state: {
      selectedClassStartId: "mercenary",
      pathStartNodeId: "mercenary_start",
      allocationPlan: {
        committedNodePath: ["mercenary_start"],
        committedEdgeKeys: [],
        previewNodePath: [],
        previewEdgeKeys: [],
        previewRouteNodePath: [],
      },
      nodeVisualScale: 3,
      buildGoalNodeIds: [],
      ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main",
      weaponSetAllocationNodeIds: { 1: [], 2: [] },
      optimizedRouteChoice: overrides.optimizedRouteChoice,
    },
  };
}
