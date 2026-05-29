import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleGraph } from "../tree/sampleGraph";
import { NodeInspector } from "./NodeInspector";

describe("NodeInspector", () => {
  it("names the selected node when no allocation path exists", () => {
    render(
      <NodeInspector
        node={sampleGraph.nodes.jewel_socket}
        edges={sampleGraph.edges}
        pathStartName="Mercenary"
      />,
    );

    expect(screen.getByText("No allocatable path from Mercenary to Jewel Socket.")).not.toBeNull();
  });

  it("describes selected-node action buttons with custom tooltips", () => {
    render(
      <NodeInspector
        node={sampleGraph.nodes.precise_shot}
        edges={sampleGraph.edges}
        canAddBuildGoal
        canAllocatePath
        allocationPath={{
          startNodeId: "mercenary_start",
          targetNodeId: "precise_shot",
          nodeIds: ["mercenary_start", "projectile_damage", "precise_shot"],
          edgeKeys: ["mercenary_start--projectile_damage", "precise_shot--projectile_damage"],
          pointCost: 2,
        }}
        allocationPathNodeNames={["Mercenary", "Projectile Damage", "Precise Shot"]}
      />,
    );

    expectTooltipText(screen.getByRole("button", { name: "Add build goal" }), "Add the selected node");
    expectTooltipText(screen.getByRole("button", { name: "Allocate path" }), "Commit this preview path");
  });
});

function expectTooltipText(element: HTMLElement, expectedText: string) {
  const tooltipId = element.getAttribute("aria-describedby");
  expect(tooltipId).toBeTruthy();
  expect(document.getElementById(tooltipId ?? "")?.textContent).toContain(expectedText);
}
