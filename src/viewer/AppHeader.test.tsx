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
    const siteHelpText = document.getElementById("site-help-tooltip")?.textContent;
    expect(siteHelpText).toContain("Ctrl + left click");
    expect(siteHelpText).toContain("Mode: Main edits the normal passive tree and is used by Build goals and Optimize route.");
    expect(siteHelpText).toContain("Mode: W1 and W2 edit weapon-set-specific passives manually; select W1 or W2, then left-click eligible nodes on the tree.");

    const buildGroup = screen.getByRole("group", { name: "Build management" });
    expect(within(buildGroup).getByLabelText("Saved build")).not.toBeNull();
    expect(within(buildGroup).queryByLabelText("Build name")).toBeNull();
    expect(within(buildGroup).getByRole("button", { name: "New build" })).not.toBeNull();
    expect(within(buildGroup).getByRole("button", { name: "Build actions" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Export builds" })).toBeNull();

    const treeSetupGroup = screen.getByRole("group", { name: "Tree setup" });
    expect(within(treeSetupGroup).getByLabelText("Path start")).not.toBeNull();
    expect(within(treeSetupGroup).queryByLabelText("Node size")).toBeNull();
    expect(within(treeSetupGroup).getByRole("button", { name: "Main allocation mode" })).not.toBeNull();
    expect(within(treeSetupGroup).getByRole("button", { name: "Weapon Set 1 allocation mode" })).not.toBeNull();
    expect(within(treeSetupGroup).getByRole("button", { name: "Weapon Set 2 allocation mode" })).not.toBeNull();
    expect(within(treeSetupGroup).queryByLabelText("Hover path preview")).toBeNull();

    const allocationGroup = screen.getByRole("group", { name: "Allocation summary" });
    expect(within(allocationGroup).getByText("Allocated 4/123")).not.toBeNull();
    expect(within(allocationGroup).queryByText("Main 4/123")).toBeNull();
    expect(within(allocationGroup).getByText("W1 1/24 · W2 2/24")).not.toBeNull();
    expect(within(allocationGroup).getByText("Ascendancy 2/8")).not.toBeNull();
  });

  it("wires header controls to their callbacks", async () => {
    const props = defaultProps();
    render(<AppHeader {...props} />);

    fireEvent.change(screen.getByLabelText("Saved build"), { target: { value: "saved-1" } });
    fireEvent.click(screen.getByRole("button", { name: "New build" }));
    fireEvent.click(screen.getByRole("button", { name: "Save build" }));
    fireEvent.change(screen.getByLabelText("Build name"), { target: { value: "Updated build" } });
    fireEvent.submit(screen.getByLabelText("Build name").closest("form")!);
    fireEvent.click(screen.getByRole("button", { name: "Build actions" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete build" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete build" }));
    fireEvent.click(screen.getByRole("button", { name: "Build actions" }));
    fireEvent.click(await screen.findByRole("button", { name: "Export builds" }));
    const importFile = new File(["{}"], "builds.json", { type: "application/json" });
    fireEvent.change(screen.getByLabelText("Import builds file"), { target: { files: [importFile] } });
    fireEvent.change(screen.getByLabelText("Path start"), { target: { value: "witch" } });
    fireEvent.click(screen.getByRole("button", { name: "Weapon Set 1 allocation mode" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset allocation" }));

    expect(props.onLoadSavedBuild).toHaveBeenCalledWith("saved-1");
    expect(props.onNewUnsavedBuild).toHaveBeenCalled();
    expect(props.onSaveCurrentBuild).toHaveBeenCalledWith("Updated build");
    expect(props.onDeleteSelectedBuild).toHaveBeenCalled();
    expect(props.onExportSavedBuilds).toHaveBeenCalled();
    expect(props.onImportSavedBuildsFile).toHaveBeenCalledWith(importFile);
    expect(props.onChangeSelectedClassStart).toHaveBeenCalledWith("witch");
    expect(props.onChangeActiveAllocationMode).toHaveBeenCalledWith("weapon1");
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
      "Optimized build",
    ]);
    expect(screen.getByText("Saved optimized route: route 3 of 4, 42 points, +1 vs best.")).not.toBeNull();
    expect(document.querySelector(".saved-build-route-choice")).toBeNull();
  });

  it("only shows contextual allocation counts", () => {
    const props = { ...defaultProps(), weaponSet1PointCount: 0, weaponSet2PointCount: 0, hasSelectedAscendancy: false };
    const { rerender } = render(<AppHeader {...props} />);
    expect(screen.queryByText(/W1 .*24/)).toBeNull();
    expect(screen.queryByText(/Ascendancy --/)).toBeNull();
    rerender(<AppHeader {...props} activeAllocationMode="weapon1" />);
    expect(screen.getByText("W1 0/24 · W2 0/24")).not.toBeNull();
    rerender(<AppHeader {...props} allocatedPointCount={6} weaponSet2PointCount={2} />);
    expect(screen.getByText("Main 4/123")).not.toBeNull();
  });

  it("saves existing builds directly but cancels blank first-save names", async () => {
    const props = defaultProps();
    const { rerender } = render(<AppHeader {...props} selectedSavedBuildId="saved-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Save build" }));
    expect(props.onSaveCurrentBuild).toHaveBeenCalledWith();
    expect(screen.queryByLabelText("Build name")).toBeNull();
    rerender(<AppHeader {...props} savedBuildName="" />);
    fireEvent.click(screen.getByRole("button", { name: "Save build" }));
    expect((await screen.findByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("Build name")).toBeNull();
    expect(props.onSaveCurrentBuild).toHaveBeenCalledTimes(1);
  });

  it("renames through Build actions without saving or deleting the build", async () => {
    const props = defaultProps();
    render(<AppHeader {...props} selectedSavedBuildId="saved-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Build actions" }));
    fireEvent.click(await screen.findByRole("button", { name: "Rename build" }));
    expect((screen.getByLabelText("Build name") as HTMLInputElement).value).toBe("Saved build");
    fireEvent.change(screen.getByLabelText("Build name"), { target: { value: " Renamed " } });
    fireEvent.submit(screen.getByLabelText("Build name").closest("form")!);
    expect(props.onRenameSelectedBuild).toHaveBeenCalledWith("Renamed");
    expect(props.onSaveCurrentBuild).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Build actions" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete build" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onDeleteSelectedBuild).not.toHaveBeenCalled();
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
    onRenameSelectedBuild: vi.fn(),
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
