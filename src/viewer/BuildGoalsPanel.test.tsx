import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleGraph } from "../tree/sampleGraph";
import { BuildGoalsPanel } from "./BuildGoalsPanel";

describe("BuildGoalsPanel", () => {
  it("shows best-found progress and route candidate navigation while optimizing", () => {
    const onPreviousRoute = vi.fn();
    const onNextRoute = vi.fn();

    render(
      <BuildGoalsPanel
        goals={[]}
        status={{ kind: "running", pointCost: 114, improvementHistory: [122, 118, 114] }}
        pobImportCode=""
        pobImportStatus={{ kind: "idle" }}
        canApplyOptimizedRoute
        routeCandidateCount={3}
        selectedRouteIndex={1}
        onPreviousRoute={onPreviousRoute}
        onNextRoute={onNextRoute}
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
    expect(screen.getByText("Route 2 of 3")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Previous optimized route" }));
    fireEvent.click(screen.getByRole("button", { name: "Next optimized route" }));

    expect(onPreviousRoute).toHaveBeenCalledOnce();
    expect(onNextRoute).toHaveBeenCalledOnce();
    expect((screen.getByRole("button", { name: "Apply optimized route" }) as HTMLButtonElement).disabled).toBe(false);
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
});

function expectTooltipText(element: HTMLElement, expectedText: string) {
  const tooltipId = element.getAttribute("aria-describedby");
  expect(tooltipId).toBeTruthy();
  expect(document.getElementById(tooltipId ?? "")?.textContent).toContain(expectedText);
}
