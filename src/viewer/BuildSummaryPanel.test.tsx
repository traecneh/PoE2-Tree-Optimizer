import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BuildSummaryPanel } from "./BuildSummaryPanel";
import { buildSummary } from "../tree/buildSummary";
import { sampleGraph } from "../tree/sampleGraph";

describe("BuildSummaryPanel", () => {
  it("renders point totals and grouped effects", () => {
    render(
      <BuildSummaryPanel
        summary={{
          pointCount: 4,
          nodeCount: 5,
          summedStats: [
            {
              key: "%:increased projectile damage",
              label: "increased Projectile Damage",
              value: 20,
              formattedValue: "20",
              unit: "%",
              text: "20% increased Projectile Damage",
              sourceNodeIds: ["projectile_small", "projectile_notable"],
              sourceNodeNames: ["Projectile Small", "Projectile Notable"],
            },
            {
              key: ":to strength",
              label: "to Strength",
              value: 15,
              formattedValue: "+15",
              unit: "",
              text: "+15 to Strength",
              sourceNodeIds: ["strength_small", "strength_notable"],
              sourceNodeNames: ["Strength Small", "Strength Notable"],
            },
            {
              key: "%:minions have <> increased attack speed",
              label: "increased Attack Speed",
              value: 6,
              formattedValue: "6",
              unit: "%",
              text: "Minions have 6% increased Attack Speed",
              sourceNodeIds: ["minion_speed_small", "minion_speed_notable"],
              sourceNodeNames: ["Minion Speed Small", "Minion Speed Notable"],
            },
          ],
          otherStats: [
            {
              text: "Cannot be Stunned",
              count: 2,
              sourceNodeIds: ["notable_a", "notable_b"],
              sourceNodeNames: ["Notable A", "Notable B"],
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("complementary", { name: "Build summary" })).not.toBeNull();
    expect(screen.getByText("4 allocated points")).not.toBeNull();
    expect(screen.getByText("20% increased Projectile Damage")).not.toBeNull();
    expect(screen.getByText("+15 to Strength")).not.toBeNull();
    expect(screen.getByText("Minions have 6% increased Attack Speed")).not.toBeNull();
    expect(screen.getByText("Minions have 6% increased Attack Speed").closest("li")?.getAttribute("title")).toBe(
      "2 sources: Minion Speed Small; Minion Speed Notable",
    );
    expect(screen.getByText("Cannot be Stunned")).not.toBeNull();
    expect(screen.getByText("Cannot be Stunned").closest("li")?.getAttribute("title")).toBe(
      "2 sources: Notable A; Notable B",
    );
    expect(screen.getByText("x2")).not.toBeNull();
  });

  it("shows an empty state before any passive points are allocated or previewed", () => {
    render(
      <BuildSummaryPanel
        summary={{
          pointCount: 0,
          nodeCount: 1,
          summedStats: [],
          otherStats: [],
        }}
      />,
    );

    expect(screen.getByText("No allocated passives yet.")).not.toBeNull();
  });

  it("renders combined damage in Totals with source details instead of a repeat badge", () => {
    const graph = {
      ...sampleGraph,
      nodes: {
        ...sampleGraph.nodes,
        projectile_damage: {
          ...sampleGraph.nodes.projectile_damage,
          stats: ["Adds 1 to 7 Lightning damage to Attacks"],
        },
        precise_shot: {
          ...sampleGraph.nodes.precise_shot,
          stats: ["Adds 1 to 7 Lightning damage to Attacks"],
        },
      },
    };
    render(<BuildSummaryPanel summary={buildSummary(graph, ["projectile_damage", "precise_shot"])} />);

    const effect = screen.getByText("Adds 2 to 14 Lightning damage to Attacks");
    expect(effect.closest("section")?.querySelector("h3")?.textContent).toBe("Totals");
    expect(effect.closest("li")?.getAttribute("title")).toBe("2 sources: Projectile Damage; Precise Shot");
    expect(screen.queryByText("Adds 1 to 7 Lightning damage to Attacks")).toBeNull();
    expect(screen.queryByText("x2")).toBeNull();
    expect(screen.getByText("2 allocated points")).not.toBeNull();
  });
});
