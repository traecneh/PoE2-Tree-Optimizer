import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TreeNode } from "../tree/types";
import { PassiveSearchPanel, passiveSearchCommitDelayMs } from "./PassiveSearchPanel";

describe("PassiveSearchPanel", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps typing responsive and commits search changes after a full-second debounce", () => {
    vi.useFakeTimers();
    const handleQueryChange = vi.fn();

    render(
      <PassiveSearchPanel
        query=""
        results={[]}
        onQueryChange={handleQueryChange}
        onSelectNode={() => undefined}
      />,
    );

    expect(passiveSearchCommitDelayMs).toBe(1000);

    const input = screen.getByLabelText("Passive search") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "critical" } });

    expect(input.value).toBe("critical");
    expect(handleQueryChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(passiveSearchCommitDelayMs - 1);
    });

    expect(handleQueryChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(handleQueryChange).toHaveBeenCalledWith("critical");
  });

  it("clears committed search after the same full-second debounce", () => {
    vi.useFakeTimers();
    const handleQueryChange = vi.fn();

    render(
      <PassiveSearchPanel
        query="critical"
        results={[]}
        onQueryChange={handleQueryChange}
        onSelectNode={() => undefined}
      />,
    );

    const input = screen.getByLabelText("Passive search") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "" } });

    expect(input.value).toBe("");
    expect(handleQueryChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(passiveSearchCommitDelayMs - 1);
    });

    expect(handleQueryChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(handleQueryChange).toHaveBeenCalledWith("");
  });

  it("adds all unselected nodes with the same matched text as build goals", () => {
    const handleAddMatchingBuildGoals = vi.fn();
    const minionOne = testNode("minion_one", "Minion Damage One", ["15% increased Minion Damage"]);
    const minionTwo = testNode("minion_two", "Minion Damage Two", ["15% increased Minion Damage"]);
    const minionThree = testNode("minion_three", "Minion Damage Three", ["15% increased Minion Damage"]);

    render(
      <PassiveSearchPanel
        query="minion damage"
        results={[
          { node: minionOne, matchedText: "15% increased Minion Damage" },
          { node: minionTwo, matchedText: "15% increased Minion Damage" },
          { node: minionThree, matchedText: "15% increased Minion Damage" },
        ]}
        buildGoalNodeIds={new Set(["minion_one"])}
        onQueryChange={() => undefined}
        onSelectNode={() => undefined}
        canAddBuildGoal={() => false}
        canAddMatchingBuildGoal={(node) => !node.flags.classStart}
        onAddMatchingBuildGoals={handleAddMatchingBuildGoals}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", {
      name: "Add all 3 nodes matching 15% increased Minion Damage to build goals",
    })[0]);

    expect(handleAddMatchingBuildGoals).toHaveBeenCalledWith(["minion_two", "minion_three"]);
  });

  it("describes search field and result actions with custom tooltips", () => {
    const minionOne = testNode("minion_one", "Minion Damage One", ["15% increased Minion Damage"]);
    const minionTwo = testNode("minion_two", "Minion Damage Two", ["15% increased Minion Damage"]);

    render(
      <PassiveSearchPanel
        query="minion damage"
        results={[
          { node: minionOne, matchedText: "15% increased Minion Damage" },
          { node: minionTwo, matchedText: "15% increased Minion Damage" },
        ]}
        onQueryChange={() => undefined}
        onSelectNode={() => undefined}
        canAddBuildGoal={() => true}
        onAddBuildGoal={() => undefined}
        canAddMatchingBuildGoal={() => true}
        onAddMatchingBuildGoals={() => undefined}
      />,
    );

    const passiveSearchTooltip = tooltipTextFor(screen.getByLabelText("Passive search"));
    expect(passiveSearchTooltip).toContain("Search examples");
    expect(passiveSearchTooltip).toContain("keystone - all keystone passives");
    expect(passiveSearchTooltip).toContain("notable - all notable passives");
    expect(passiveSearchTooltip).toContain("empty jewel slots - jewel sockets");
    expect(passiveSearchTooltip).toContain("Minion Attack Speed - minion attack speed");
    expect(passiveSearchTooltip).toContain("\"Stun Threshold\" \"Energy Shield\" - exact ES stun-threshold wording");
    expect(passiveSearchTooltip).toContain("Flask Charges -Life -Mana - flask charge nodes excluding Life/Mana flask nodes");
    expectTooltipText(screen.getAllByRole("button", { name: "Minion Damage One 15% increased Minion Damage" })[0], "Select this passive");
    expectTooltipText(screen.getByRole("button", { name: "Add Minion Damage One to build goals" }), "Add this passive");
    expectTooltipText(screen.getAllByRole("button", {
      name: "Add all 2 nodes matching 15% increased Minion Damage to build goals",
    })[0], "same matched effect");
  });
});

function expectTooltipText(element: HTMLElement, expectedText: string) {
  expect(tooltipTextFor(element)).toContain(expectedText);
}

function tooltipTextFor(element: HTMLElement) {
  const tooltipId = element.getAttribute("aria-describedby");
  expect(tooltipId).toBeTruthy();
  return document.getElementById(tooltipId ?? "")?.textContent ?? "";
}

function testNode(id: string, name: string, stats: string[], flags: TreeNode["flags"] = { small: true }): TreeNode {
  return {
    id,
    name,
    stats,
    position: { x: 0, y: 0 },
    flags,
  };
}
