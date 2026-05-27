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
});

function testNode(id: string, name: string, stats: string[], flags: TreeNode["flags"] = { small: true }): TreeNode {
  return {
    id,
    name,
    stats,
    position: { x: 0, y: 0 },
    flags,
  };
}
