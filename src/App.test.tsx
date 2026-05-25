import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { sampleGraph } from "./tree/sampleGraph";
import type { TreeGraph } from "./tree/types";

describe("App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubTreeFetch() {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
  }

  function stubTreeFetchWithGraph(graph: TreeGraph) {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(graph),
    })));
  }

  function endpointFixtureGraph(): TreeGraph {
    return {
      ...sampleGraph,
      gameVersion: "endpoint-fixture",
      nodes: {
        ...sampleGraph.nodes,
        near_start_branch: {
          id: "near_start_branch",
          groupId: "g1",
          name: "Near Start Branch",
          stats: ["10% increased Branch Damage"],
          position: { x: -120, y: 0 },
          flags: { notable: true },
        },
      },
      edges: [
        ...sampleGraph.edges,
        { from: "mercenary_start", to: "near_start_branch" },
      ],
      bounds: { ...sampleGraph.bounds, minX: -120 },
    };
  }

  function searchSortFixtureGraph(): TreeGraph {
    return {
      ...sampleGraph,
      gameVersion: "search-sort-fixture",
      nodes: {
        ...sampleGraph.nodes,
        close_critical: {
          id: "close_critical",
          groupId: "g1",
          name: "Close Critical",
          stats: ["10% increased Critical Hit Chance"],
          position: { x: 80, y: 80 },
          flags: { small: true },
        },
      },
      groups: {
        ...sampleGraph.groups,
        g1: {
          ...sampleGraph.groups.g1,
          nodeIds: [...sampleGraph.groups.g1.nodeIds, "close_critical"],
        },
      },
      edges: [
        ...sampleGraph.edges,
        { from: "mercenary_start", to: "close_critical" },
      ],
      bounds: { ...sampleGraph.bounds, maxY: 90 },
    };
  }

  it("lets the viewer node size be adjusted", () => {
    stubTreeFetch();

    render(<App />);

    const classStart = screen.getByRole("button", { name: "Mercenary" });
    expect(classStart.querySelector(".node-core")?.getAttribute("r")).toBe("52");

    fireEvent.change(screen.getByLabelText("Node size"), { target: { value: "1" } });

    expect(classStart.querySelector(".node-core")?.getAttribute("r")).toBe("26");
  });

  it("searches passive names and stats and highlights matching nodes", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.change(screen.getByLabelText("Passive search"), { target: { value: "critical" } });

    expect(screen.getByText("1 match")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Precise Shot" }).classList.contains("search-match")).toBe(true);
    expect(screen.getByRole("button", { name: "Precise Shot 25% increased Critical Hit Chance" })).not.toBeNull();
    expect(screen.getByText("Notable · 2 points from allocation")).not.toBeNull();
    expect(screen.queryByText("Notable · precise_shot")).toBeNull();
  });

  it("focuses the map highlight when hovering a passive search result", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.change(screen.getByLabelText("Passive search"), { target: { value: "critical" } });

    const result = screen.getByRole("button", { name: "Precise Shot 25% increased Critical Hit Chance" });
    const mapNode = screen.getByRole("button", { name: "Precise Shot" });

    fireEvent.mouseEnter(result);

    expect(mapNode.classList.contains("search-focus")).toBe(true);
    expect(mapNode.querySelector(".search-focus-marker")).not.toBeNull();

    fireEvent.mouseLeave(result);

    expect(mapNode.classList.contains("search-focus")).toBe(false);
    expect(mapNode.querySelector(".search-focus-marker")).toBeNull();
  });

  it("keeps the map highlight focused when selecting a passive search result", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.change(screen.getByLabelText("Passive search"), { target: { value: "critical" } });

    const result = screen.getByRole("button", { name: "Precise Shot 25% increased Critical Hit Chance" });
    const mapNode = screen.getByRole("button", { name: "Precise Shot" });

    fireEvent.click(result);

    expect(mapNode.classList.contains("search-focus")).toBe(true);
    expect(mapNode.querySelector(".search-focus-marker")).not.toBeNull();
  });

  it("shows allocated status for passive search results that are already allocated", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    fireEvent.click(screen.getByRole("button", { name: "Allocate path" }));
    fireEvent.change(screen.getByLabelText("Passive search"), { target: { value: "critical" } });

    expect(screen.getByText("Notable · Allocated")).not.toBeNull();
  });

  it("calculates passive search distance from the closest node in the current planned path", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    fireEvent.change(screen.getByLabelText("Passive search"), { target: { value: "critical" } });

    expect(screen.getByText("Notable · 0 points from allocation")).not.toBeNull();
    expect(screen.queryByText("Notable · Allocated")).toBeNull();

    fireEvent.change(screen.getByLabelText("Passive search"), { target: { value: "empty jewel slots" } });

    expect(screen.getByText("Jewel socket · 1 point from allocation")).not.toBeNull();
    expect(screen.queryByText("Jewel socket · 3 points from allocation")).toBeNull();
  });

  it("sorts passive search results by closest allocation distance", async () => {
    stubTreeFetchWithGraph(searchSortFixtureGraph());

    render(<App />);

    await screen.findByText("5 nodes, 4 links, version search-sort-fixture");

    fireEvent.change(screen.getByLabelText("Passive search"), { target: { value: "critical" } });

    const resultNames = Array.from(document.querySelectorAll(".search-result-name"))
      .map((element) => element.textContent);

    expect(resultNames.slice(0, 2)).toEqual(["Close Critical", "Precise Shot"]);
    expect(screen.getByText("Small · 1 point from allocation")).not.toBeNull();
    expect(screen.getByText("Notable · 2 points from allocation")).not.toBeNull();
  });

  it("matches jewel sockets when searching for empty jewel slots", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.change(screen.getByLabelText("Passive search"), { target: { value: "empty jewel slots" } });

    expect(screen.getByText("1 match")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("search-match")).toBe(true);
  });

  it("adds, removes, and clears build goals from the node inspector", () => {
    stubTreeFetch();

    render(<App />);

    const goalsPanel = screen.getByRole("region", { name: "Build goals" });

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    fireEvent.click(screen.getByRole("button", { name: "Add build goal" }));

    expect(within(goalsPanel).getByText("Precise Shot")).not.toBeNull();
    expect(within(goalsPanel).getByText("Notable · Reached")).not.toBeNull();

    fireEvent.click(within(goalsPanel).getByRole("button", { name: "Remove Precise Shot build goal" }));

    expect(within(goalsPanel).queryByText("Precise Shot")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    fireEvent.click(screen.getByRole("button", { name: "Add build goal" }));
    fireEvent.click(screen.getByRole("button", { name: "Jewel Socket" }));
    fireEvent.click(screen.getByRole("button", { name: "Add build goal" }));
    fireEvent.click(within(goalsPanel).getByRole("button", { name: "Clear goals" }));

    expect(within(goalsPanel).getByText("No build goals selected.")).not.toBeNull();
  });

  it("adds build goals from passive search results without duplicating them", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.change(screen.getByLabelText("Passive search"), { target: { value: "critical" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Precise Shot to build goals" }));

    const goalsPanel = screen.getByRole("region", { name: "Build goals" });
    expect(within(goalsPanel).getAllByText("Precise Shot")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    expect((screen.getByRole("button", { name: "Build goal added" }) as HTMLButtonElement).disabled).toBe(true);
    expect(within(goalsPanel).getAllByText("Precise Shot")).toHaveLength(1);

    const searchResult = screen.getByRole("button", { name: "Precise Shot 25% increased Critical Hit Chance" });
    expect(searchResult.querySelector("button")).toBeNull();
  });

  it("marks build goal nodes on the tree", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    fireEvent.click(screen.getByRole("button", { name: "Add build goal" }));

    const node = screen.getByRole("button", { name: "Precise Shot" });
    expect(node.classList.contains("build-goal")).toBe(true);
    expect(node.querySelector(".build-goal-marker")).not.toBeNull();
  });

  it("optimizes build goals into a preview without applying the route", async () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.change(screen.getByLabelText("Passive search"), { target: { value: "critical" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Precise Shot to build goals" }));
    fireEvent.change(screen.getByLabelText("Passive search"), { target: { value: "empty jewel slots" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Jewel Socket to build goals" }));
    fireEvent.click(screen.getByRole("button", { name: "Optimize route" }));

    expect(await screen.findByText("Optimized route: 3 points")).not.toBeNull();
    expect(screen.getByText("Allocated 0 points")).not.toBeNull();
    expect(document.querySelectorAll(".tree-edge.allocation-path")).toHaveLength(3);
    expect((screen.getByRole("button", { name: "Apply optimized route" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("applies an optimized route to committed allocation", async () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.change(screen.getByLabelText("Passive search"), { target: { value: "critical" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Precise Shot to build goals" }));
    fireEvent.change(screen.getByLabelText("Passive search"), { target: { value: "empty jewel slots" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Jewel Socket to build goals" }));
    fireEvent.click(screen.getByRole("button", { name: "Optimize route" }));

    await screen.findByText("Optimized route: 3 points");
    fireEvent.click(screen.getByRole("button", { name: "Apply optimized route" }));

    expect(screen.getByText("Allocated 3 points")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Precise Shot" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("allocated")).toBe(true);
    expect(document.querySelectorAll(".tree-edge.allocated")).toHaveLength(3);
  });

  it("uses the current pending path as the optimizer base", async () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    fireEvent.change(screen.getByLabelText("Passive search"), { target: { value: "empty jewel slots" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Jewel Socket to build goals" }));
    fireEvent.click(screen.getByRole("button", { name: "Optimize route" }));

    expect(await screen.findByText("Optimized route: 1 point")).not.toBeNull();
    expect(document.querySelectorAll(".tree-edge.allocation-path")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Projectile Damage" }).classList.contains("allocation-path")).toBe(false);
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("allocation-path")).toBe(true);
  });

  it("applies a branching optimized route with deterministic prune order", async () => {
    stubTreeFetchWithGraph(endpointFixtureGraph());

    render(<App />);

    await screen.findByText("5 nodes, 4 links, version endpoint-fixture");

    fireEvent.change(screen.getByLabelText("Passive search"), { target: { value: "empty jewel slots" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Jewel Socket to build goals" }));
    fireEvent.change(screen.getByLabelText("Passive search"), { target: { value: "branch" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Near Start Branch to build goals" }));
    fireEvent.click(screen.getByRole("button", { name: "Optimize route" }));

    await screen.findByText("Optimized route: 4 points");
    fireEvent.click(screen.getByRole("button", { name: "Apply optimized route" }));

    expect(screen.getByText("Allocated 4 points")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Near Start Branch" }));

    await waitFor(() => {
      expect(screen.getByText("Allocated 1 point")).not.toBeNull();
    });
    expect(screen.getByRole("button", { name: "Near Start Branch" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("allocated")).toBe(false);
  });

  it("previews the allocation path from the selected class start to the selected target", () => {
    stubTreeFetch();

    render(<App />);

    expect((screen.getByLabelText("Path start") as HTMLSelectElement).value).toBe("mercenary_start");
    expect(screen.getByRole("button", { name: "Mercenary" }).classList.contains("path-start")).toBe(true);
    expect(screen.getByRole("button", { name: "Mercenary" }).querySelector(".path-start-marker")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));

    expect(screen.getByText("Allocation path")).not.toBeNull();
    expect(screen.getByText("2 points")).not.toBeNull();
    expect(screen.getByText("Mercenary -> Projectile Damage -> Precise Shot")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Projectile Damage" }).classList.contains("allocation-path")).toBe(true);
    expect(document.querySelectorAll(".tree-edge.allocation-path")).toHaveLength(2);
  });

  it("previews a hover path from the closest allocated node without selecting the target", () => {
    stubTreeFetch();

    render(<App />);

    const target = screen.getByRole("button", { name: "Precise Shot" });

    fireEvent.mouseEnter(target, { clientX: 220, clientY: 140 });

    expect(screen.getByText("No node selected.")).not.toBeNull();
    expect(target.classList.contains("selected")).toBe(false);
    expect(screen.getByRole("button", { name: "Mercenary" }).classList.contains("hover-allocation-path")).toBe(false);
    expect(screen.getByRole("button", { name: "Projectile Damage" }).classList.contains("hover-allocation-path")).toBe(true);
    expect(target.classList.contains("hover-allocation-path")).toBe(true);
    expect(document.querySelectorAll(".tree-edge.hover-allocation-path")).toHaveLength(2);
    expect(document.querySelectorAll(".hover-path-highlight-layer .hover-allocation-path-edge")).toHaveLength(2);

    fireEvent.mouseLeave(target);

    expect(screen.getByRole("button", { name: "Projectile Damage" }).classList.contains("hover-allocation-path")).toBe(false);
    expect(document.querySelectorAll(".tree-edge.hover-allocation-path")).toHaveLength(0);
    expect(document.querySelectorAll(".hover-path-highlight-layer .hover-allocation-path-edge")).toHaveLength(0);
  });

  it("previews hover paths from the nearest committed allocation", async () => {
    stubTreeFetchWithGraph(endpointFixtureGraph());

    render(<App />);

    await screen.findByText("5 nodes, 4 links, version endpoint-fixture");

    fireEvent.click(screen.getByRole("button", { name: "Jewel Socket" }));
    fireEvent.click(screen.getByRole("button", { name: "Allocate path" }));
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Near Start Branch" }), { clientX: 20, clientY: 140 });

    expect(screen.getByRole("button", { name: "Mercenary" }).classList.contains("hover-allocation-path")).toBe(false);
    expect(screen.getByRole("button", { name: "Near Start Branch" }).classList.contains("hover-allocation-path")).toBe(true);
    expect(screen.getByRole("button", { name: "Projectile Damage" }).classList.contains("hover-allocation-path")).toBe(false);
    expect(document.querySelectorAll(".tree-edge.hover-allocation-path")).toHaveLength(1);
  });

  it("previews only the unallocated hover extension from a pending path", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Jewel Socket" }), { clientX: 320, clientY: 180 });

    expect(screen.getByRole("button", { name: "Mercenary" }).classList.contains("hover-allocation-path")).toBe(false);
    expect(screen.getByRole("button", { name: "Projectile Damage" }).classList.contains("hover-allocation-path")).toBe(false);
    expect(screen.getByRole("button", { name: "Precise Shot" }).classList.contains("hover-allocation-path")).toBe(false);
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("hover-allocation-path")).toBe(true);
    expect(document.querySelectorAll(".tree-edge.hover-allocation-path")).toHaveLength(1);
    expect(document.querySelectorAll(".tree-edge.allocation-path.hover-allocation-path")).toHaveLength(0);
  });

  it("commits previewed allocation paths and previews new paths from allocated nodes", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    fireEvent.click(screen.getByRole("button", { name: "Allocate path" }));

    expect(screen.getByText("Allocated 2 points")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Precise Shot" }).classList.contains("allocated")).toBe(true);
    expect(document.querySelectorAll(".tree-edge.allocated")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Jewel Socket" }));

    expect(screen.getByText("1 point")).not.toBeNull();
    expect(screen.getByText("Precise Shot -> Jewel Socket")).not.toBeNull();
    expect(document.querySelectorAll(".tree-edge.allocation-path")).toHaveLength(1);
  });

  it("previews new paths from the closest allocated node", async () => {
    stubTreeFetchWithGraph(endpointFixtureGraph());

    render(<App />);

    await screen.findByText("5 nodes, 4 links, version endpoint-fixture");

    fireEvent.click(screen.getByRole("button", { name: "Jewel Socket" }));
    fireEvent.click(screen.getByRole("button", { name: "Allocate path" }));
    fireEvent.click(screen.getByRole("button", { name: "Near Start Branch" }));

    expect(screen.getByText("1 point")).not.toBeNull();
    expect(screen.getByText("Mercenary -> Near Start Branch")).not.toBeNull();
    expect(document.querySelectorAll(".tree-edge.allocation-path")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Allocate path" }));

    expect(screen.getByText("Allocated 4 points")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByRole("button", { name: "Near Start Branch" }).classList.contains("allocated")).toBe(true);
    expect(document.querySelectorAll(".tree-edge.allocated")).toHaveLength(4);
  });

  it("branches uncommitted preview paths from the closest pending node", async () => {
    stubTreeFetchWithGraph(endpointFixtureGraph());

    render(<App />);

    await screen.findByText("5 nodes, 4 links, version endpoint-fixture");

    fireEvent.click(screen.getByRole("button", { name: "Jewel Socket" }));

    expect(screen.getByText("3 points")).not.toBeNull();
    expect(screen.getByText("Mercenary -> Projectile Damage -> Precise Shot -> Jewel Socket")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Near Start Branch" }));

    expect(screen.getByText("Allocated 0 points")).not.toBeNull();
    expect(screen.getByText("1 point")).not.toBeNull();
    expect(screen.getByText("Mercenary -> Near Start Branch")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("allocation-path")).toBe(true);
    expect(screen.getByRole("button", { name: "Near Start Branch" }).classList.contains("allocation-path")).toBe(true);
    expect(document.querySelectorAll(".tree-edge.allocation-path")).toHaveLength(4);
  });

  it("clicking an allocated node prunes later allocated nodes", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Jewel Socket" }));
    fireEvent.click(screen.getByRole("button", { name: "Allocate path" }));

    expect(screen.getByText("Allocated 3 points")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("allocated")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));

    expect(screen.getByText("Allocated 2 points")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Precise Shot" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("allocated")).toBe(false);
    expect(document.querySelectorAll(".tree-edge.allocated")).toHaveLength(2);
  });
});
