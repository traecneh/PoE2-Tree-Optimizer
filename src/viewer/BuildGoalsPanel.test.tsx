import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sampleGraph } from "../tree/sampleGraph";
import { BuildGoalsPanel } from "./BuildGoalsPanel";

describe("BuildGoalsPanel", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows best-found progress and route candidate navigation while optimizing", () => {
    const onPreviousRoute = vi.fn();
    const onNextRoute = vi.fn();
    const onSelectRouteCandidate = vi.fn();

    render(
      <BuildGoalsPanel
        goals={[]}
        status={{ kind: "running", pointCost: 114, improvementHistory: [122, 118, 114] }}
        pobImportCode=""
        pobImportStatus={{ kind: "idle" }}
        canApplyOptimizedRoute
        routeCandidateSummaries={[
          { index: 0, pointCost: 114, pointCostRouteNumber: 1, pointCostRouteCount: 2 },
          { index: 1, pointCost: 114, pointCostRouteNumber: 2, pointCostRouteCount: 2 },
          { index: 2, pointCost: 116, pointCostRouteNumber: 1, pointCostRouteCount: 1 },
          { index: 3, pointCost: 118, pointCostRouteNumber: 1, pointCostRouteCount: 1 },
        ]}
        selectedRouteIndex={1}
        onPreviousRoute={onPreviousRoute}
        onNextRoute={onNextRoute}
        onSelectRouteCandidate={onSelectRouteCandidate}
        onPobImportCodeChange={vi.fn()}
        onImportPobBuildGoals={vi.fn()}
        onRemoveGoal={vi.fn()}
        onClearGoals={vi.fn()}
        onOptimize={vi.fn()}
        onCancel={vi.fn()}
        onApplyOptimizedRoute={vi.fn()}
      />,
    );

    expect(screen.getByText("Best found so far: 114 points")).not.toBeNull();
    expect(screen.getByText("Improved: 122 -> 118 -> 114")).not.toBeNull();
    expect(screen.getByText("Route 2 of 4")).not.toBeNull();
    expect(screen.getByText("114 points · variant 2 of 2")).not.toBeNull();
    expect(screen.getByRole("button", { name: "114 points (2 routes)" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "116 points (1 route)" })).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Previous optimized route" }));
    fireEvent.click(screen.getByRole("button", { name: "Next optimized route" }));
    fireEvent.click(screen.getByRole("button", { name: "116 points (1 route)" }));

    expect(onPreviousRoute).toHaveBeenCalledOnce();
    expect(onNextRoute).toHaveBeenCalledOnce();
    expect(onSelectRouteCandidate).toHaveBeenCalledWith(2);
    expect((screen.getByRole("button", { name: "Apply selected route" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("shows the applied optimized route choice so users know what saving keeps", () => {
    render(
      <BuildGoalsPanel
        goals={[]}
        status={{ kind: "already-reached" }}
        pobImportCode=""
        pobImportStatus={{ kind: "idle" }}
        canApplyOptimizedRoute={false}
        appliedRouteChoice={{
          routeIndex: 2,
          routeNumber: 3,
          routeCount: 4,
          pointCost: 42,
          pointDeltaFromBest: 1,
          pointCostRouteNumber: 1,
          pointCostRouteCount: 2,
        }}
        onPobImportCodeChange={vi.fn()}
        onImportPobBuildGoals={vi.fn()}
        onRemoveGoal={vi.fn()}
        onClearGoals={vi.fn()}
        onOptimize={vi.fn()}
        onCancel={vi.fn()}
        onApplyOptimizedRoute={vi.fn()}
      />,
    );

    expect(screen.getByText("Applied route 3 of 4 · 42 points · +1 vs best.")).not.toBeNull();
    expect(screen.getByText("Saving this build keeps the selected route.")).not.toBeNull();
  });

  it("shows selected route details and comparison against the best route", () => {
    render(
      <BuildGoalsPanel
        goals={[]}
        status={{ kind: "success", pointCost: 41, searchType: "anytime", completeReason: "cancelled" }}
        pobImportCode=""
        pobImportStatus={{ kind: "idle" }}
        canApplyOptimizedRoute
        routeCandidateSummaries={[
          { index: 0, pointCost: 41, pointCostRouteNumber: 1, pointCostRouteCount: 1 },
          { index: 1, pointCost: 42, pointCostRouteNumber: 1, pointCostRouteCount: 3 },
        ]}
        selectedRouteIndex={1}
        routeDetails={{
          pointCost: 42,
          pointDeltaFromBest: 1,
          addedNodeCount: 42,
          selectedOnlyNodeNames: ["Arcane Mixtures", "Flow Like Water"],
          bestOnlyNodeNames: ["Dampening Shield"],
          selectedOnlyEdgeCount: 4,
          bestOnlyEdgeCount: 3,
          routeSummary: {
            pointCount: 42,
            nodeCount: 42,
            summedStats: [{
              key: "%:increased maximum energy shield",
              label: "increased maximum Energy Shield",
              value: 58,
              formattedValue: "58",
              unit: "%",
              text: "58% increased maximum Energy Shield",
              sourceNodeIds: ["energy-a", "energy-b"],
              sourceNodeNames: ["Arcane Mixtures", "Flow Like Water"],
            }],
            otherStats: [{
              text: "Cannot be Stunned",
              count: 1,
              sourceNodeIds: ["stun"],
              sourceNodeNames: ["Arcane Mixtures"],
            }],
          },
          selectedOnlySummary: {
            pointCount: 2,
            nodeCount: 2,
            summedStats: [{
              key: ":to strength",
              label: "to Strength",
              value: 10,
              formattedValue: "+10",
              unit: "",
              text: "+10 to Strength",
              sourceNodeIds: ["strength"],
              sourceNodeNames: ["Arcane Mixtures"],
            }],
            otherStats: [],
          },
          bestOnlySummary: {
            pointCount: 1,
            nodeCount: 1,
            summedStats: [],
            otherStats: [],
          },
        }}
        onPobImportCodeChange={vi.fn()}
        onImportPobBuildGoals={vi.fn()}
        onRemoveGoal={vi.fn()}
        onClearGoals={vi.fn()}
        onOptimize={vi.fn()}
        onCancel={vi.fn()}
        onApplyOptimizedRoute={vi.fn()}
      />,
    );

    expect(screen.getByRole("region", { name: "Selected route details" })).not.toBeNull();
    expect(screen.getByText("+1 point compared with best route")).not.toBeNull();
    expect(screen.getByText("42 added passives")).not.toBeNull();
    expect(screen.getByText("Only in this route")).not.toBeNull();
    expect(screen.getByText("Arcane Mixtures")).not.toBeNull();
    expect(screen.getByText("Flow Like Water")).not.toBeNull();
    expect(screen.getByText("Only in best route")).not.toBeNull();
    expect(screen.getByText("Dampening Shield")).not.toBeNull();
    expect(screen.getByText("4 route links differ here; 3 route links only in best.")).not.toBeNull();
    expect(screen.getByText("Route effects")).not.toBeNull();
    expect(screen.getByText("58% increased maximum Energy Shield")).not.toBeNull();
    expect(screen.getByText("Cannot be Stunned")).not.toBeNull();
    expect(screen.getByText("Unique effects here")).not.toBeNull();
    expect(screen.getByText("+10 to Strength")).not.toBeNull();
  });

  it("shows and resets the no-improvement countdown while searching", () => {
    vi.useFakeTimers();
    const commonProps = {
      goals: [],
      pobImportCode: "",
      pobImportStatus: { kind: "idle" as const },
      canApplyOptimizedRoute: true,
      onPobImportCodeChange: vi.fn(),
      onImportPobBuildGoals: vi.fn(),
      onRemoveGoal: vi.fn(),
      onClearGoals: vi.fn(),
      onOptimize: vi.fn(),
      onCancel: vi.fn(),
      onApplyOptimizedRoute: vi.fn(),
    };
    const { rerender } = render(
      <BuildGoalsPanel
        {...commonProps}
        status={{ kind: "running", pointCost: 122, improvementHistory: [122] }}
      />,
    );

    expect(screen.getByText("Stopping in 60s unless a better route is found.")).not.toBeNull();
    const progress = screen.getByRole("progressbar", { name: "Optimizer improvement countdown" }) as HTMLProgressElement;
    expect(progress.max).toBe(60);
    expect(progress.value).toBe(60);

    act(() => {
      vi.advanceTimersByTime(15_000);
    });

    expect(screen.getByText("Stopping in 45s unless a better route is found.")).not.toBeNull();
    expect(progress.value).toBe(45);

    rerender(
      <BuildGoalsPanel
        {...commonProps}
        status={{ kind: "running", pointCost: 118, improvementHistory: [122, 118] }}
      />,
    );

    expect(screen.getByText("Stopping in 60s unless a better route is found.")).not.toBeNull();
    expect(progress.value).toBe(60);
  });

  it("explains why optimized route search finished", () => {
    const commonProps = {
      goals: [],
      pobImportCode: "",
      pobImportStatus: { kind: "idle" as const },
      canApplyOptimizedRoute: true,
      onPobImportCodeChange: vi.fn(),
      onImportPobBuildGoals: vi.fn(),
      onRemoveGoal: vi.fn(),
      onClearGoals: vi.fn(),
      onOptimize: vi.fn(),
      onCancel: vi.fn(),
      onApplyOptimizedRoute: vi.fn(),
    };
    const { rerender } = render(
      <BuildGoalsPanel
        {...commonProps}
        status={{ kind: "success", pointCost: 147, searchType: "anytime", completeReason: "no-improvement" }}
      />,
    );

    expect(screen.getByText("Best route found: 147 points")).not.toBeNull();
    expect(screen.getByText("Stopped after 60s without improvement.")).not.toBeNull();

    rerender(
      <BuildGoalsPanel
        {...commonProps}
        status={{ kind: "success", pointCost: 12, searchType: "exact", completeReason: "exact" }}
      />,
    );

    expect(screen.getByText("Optimized route: 12 points")).not.toBeNull();
    expect(screen.getByText("Exact route found.")).not.toBeNull();

    rerender(
      <BuildGoalsPanel
        {...commonProps}
        status={{ kind: "success", pointCost: 93, searchType: "anytime", completeReason: "cancelled" }}
      />,
    );

    expect(screen.getByText("Cancelled after showing the best route found.")).not.toBeNull();
  });

  it("describes build goal controls with custom tooltips", () => {
    render(
      <BuildGoalsPanel
        goals={[{ node: sampleGraph.nodes.precise_shot, allocationDistance: 2, reached: false }]}
        status={{ kind: "idle" }}
        pobImportCode="example-code"
        pobImportStatus={{ kind: "idle" }}
        canApplyOptimizedRoute
        onPobImportCodeChange={vi.fn()}
        onImportPobBuildGoals={vi.fn()}
        onRemoveGoal={vi.fn()}
        onClearGoals={vi.fn()}
        onOptimize={vi.fn()}
        onCancel={vi.fn()}
        onApplyOptimizedRoute={vi.fn()}
      />,
    );

    expectTooltipText(screen.getByRole("button", { name: "Clear goals" }), "Remove every selected build goal");
    expectTooltipText(screen.getByLabelText("PoB build code"), "Paste a Path of Building code");
    expectTooltipText(screen.getByRole("button", { name: "Import PoB goals" }), "Decode the pasted PoB code");
    expectTooltipText(screen.getByRole("button", { name: "Remove Precise Shot build goal" }), "Remove this goal");
    expectTooltipText(screen.getByRole("button", { name: "Optimize route" }), "Preview the shortest route");
    expectTooltipText(screen.getByRole("button", { name: "Cancel" }), "Stop the running optimizer");
    expectTooltipText(screen.getByRole("button", { name: "Apply optimized route" }), "Commit the optimized preview");
  });

  it("explains that weapon-set mode uses direct tree clicks instead of build goal optimization", () => {
    render(
      <BuildGoalsPanel
        activeAllocationMode="weapon1"
        goals={[]}
        status={{ kind: "idle" }}
        pobImportCode=""
        pobImportStatus={{ kind: "idle" }}
        canApplyOptimizedRoute={false}
        onPobImportCodeChange={vi.fn()}
        onImportPobBuildGoals={vi.fn()}
        onRemoveGoal={vi.fn()}
        onClearGoals={vi.fn()}
        onOptimize={vi.fn()}
        onCancel={vi.fn()}
        onApplyOptimizedRoute={vi.fn()}
      />,
    );

    expect(screen.getByText("Weapon Set 1 mode is active.")).not.toBeNull();
    expect(screen.getByText("Build goals and Optimize route still affect the main tree only.")).not.toBeNull();
    expect(screen.getByText("To add Weapon Set 1 passives, left-click eligible nodes directly on the tree.")).not.toBeNull();
  });

  it("reports a concise PoB import summary", () => {
    render(
      <BuildGoalsPanel
        goals={[]}
        status={{ kind: "idle" }}
        pobImportCode="example-code"
        pobImportStatus={{
          kind: "success",
          importedGoalCount: 3,
          pobBasePassivePointCount: 10,
          selectedAscendancyNodeCount: 0,
          selectedWeaponSet1NodeCount: 0,
          selectedWeaponSet2NodeCount: 0,
          alreadySelectedGoalCount: 0,
          missingNodeCount: 0,
        }}
        canApplyOptimizedRoute={false}
        onPobImportCodeChange={vi.fn()}
        onImportPobBuildGoals={vi.fn()}
        onRemoveGoal={vi.fn()}
        onClearGoals={vi.fn()}
        onOptimize={vi.fn()}
        onCancel={vi.fn()}
        onApplyOptimizedRoute={vi.fn()}
      />,
    );

    expect(screen.getByText("Imported 3 build goals.")).not.toBeNull();
    expect(screen.getByText("PoB base passives: 10.")).not.toBeNull();
    expect(screen.queryByText(/weapon set/i)).toBeNull();
    expect(screen.queryByText(/Non-weapon nodes imported/i)).toBeNull();
  });

  it("reports selected ascendancy nodes during PoB import", () => {
    render(
      <BuildGoalsPanel
        goals={[]}
        status={{ kind: "idle" }}
        pobImportCode="example-code"
        pobImportStatus={{
          kind: "success",
          importedGoalCount: 1,
          pobBasePassivePointCount: 8,
          selectedAscendancyNodeCount: 8,
          selectedWeaponSet1NodeCount: 0,
          selectedWeaponSet2NodeCount: 0,
          alreadySelectedGoalCount: 0,
          missingNodeCount: 0,
        }}
        canApplyOptimizedRoute={false}
        onPobImportCodeChange={vi.fn()}
        onImportPobBuildGoals={vi.fn()}
        onRemoveGoal={vi.fn()}
        onClearGoals={vi.fn()}
        onOptimize={vi.fn()}
        onCancel={vi.fn()}
        onApplyOptimizedRoute={vi.fn()}
      />,
    );

    expect(screen.getByText("Selected 8 ascendancy passives.")).not.toBeNull();
  });

  it("shows expandable PoB import diagnostics", () => {
    render(
      <BuildGoalsPanel
        goals={[]}
        status={{ kind: "idle" }}
        pobImportCode="example-code"
        pobImportStatus={{
          kind: "success",
          importedGoalCount: 1,
          pobBasePassivePointCount: 12,
          selectedAscendancyNodeCount: 1,
          selectedWeaponSet1NodeCount: 1,
          selectedWeaponSet2NodeCount: 1,
          alreadySelectedGoalCount: 1,
          missingNodeCount: 1,
          details: {
            activeSpecTitle: "Bossing",
            importedGoalNodes: [{ nodeId: "101", label: "Required Notable" }],
            alreadySelectedGoalNodes: [{ nodeId: "102", label: "Existing Goal" }],
            selectedAscendancyNodes: [{ nodeId: "201", label: "Ascendancy Notable" }],
            missingNodeIds: ["999"],
            weaponSetNodeIds: ["301", "302"],
            ignoredNodes: [
              { nodeId: "100", label: "Start", reason: "class-start" },
              { nodeId: "103", label: "Pathing", reason: "not-goalable" },
              { nodeId: "104", label: "Disconnected Keystone", reason: "not-connected" },
            ],
          },
        }}
        canApplyOptimizedRoute={false}
        onPobImportCodeChange={vi.fn()}
        onImportPobBuildGoals={vi.fn()}
        onRemoveGoal={vi.fn()}
        onClearGoals={vi.fn()}
        onOptimize={vi.fn()}
        onCancel={vi.fn()}
        onApplyOptimizedRoute={vi.fn()}
      />,
    );

    expect(screen.getByText("Import details")).not.toBeNull();
    expect(screen.getByText("PoB tree spec: Bossing")).not.toBeNull();
    expect(screen.getByText("New build goals (1)")).not.toBeNull();
    expect(screen.getByText("Required Notable (101)")).not.toBeNull();
    expect(screen.getByText("Already selected goals (1)")).not.toBeNull();
    expect(screen.getByText("Selected ascendancy passives (1)")).not.toBeNull();
    expect(screen.getByText("Not found in current tree data (1)")).not.toBeNull();
    expect(screen.getByText("999")).not.toBeNull();
    expect(screen.getByText("Selected weapon-set passives (2)")).not.toBeNull();
    expect(screen.getByText("Ignored class starts (1)")).not.toBeNull();
    expect(screen.getByText("Ignored pathing passives (1)")).not.toBeNull();
    expect(screen.getByText("Ignored disconnected build goals (1)")).not.toBeNull();
  });
});

function expectTooltipText(element: HTMLElement, expectedText: string) {
  const tooltipId = element.getAttribute("aria-describedby");
  expect(tooltipId).toBeTruthy();
  expect(document.getElementById(tooltipId ?? "")?.textContent).toContain(expectedText);
}
