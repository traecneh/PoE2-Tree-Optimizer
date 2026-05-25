import { fireEvent, render, screen } from "@testing-library/react";
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
          flags: { small: true },
        },
      },
      edges: [
        ...sampleGraph.edges,
        { from: "mercenary_start", to: "near_start_branch" },
      ],
      bounds: { ...sampleGraph.bounds, minX: -120 },
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

  it("matches jewel sockets when searching for empty jewel slots", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.change(screen.getByLabelText("Passive search"), { target: { value: "empty jewel slots" } });

    expect(screen.getByText("1 match")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("search-match")).toBe(true);
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

  it("previews new paths from the last allocated node instead of the nearest allocated node", async () => {
    stubTreeFetchWithGraph(endpointFixtureGraph());

    render(<App />);

    await screen.findByText("5 nodes, 4 links, version endpoint-fixture");

    fireEvent.click(screen.getByRole("button", { name: "Jewel Socket" }));
    fireEvent.click(screen.getByRole("button", { name: "Allocate path" }));
    fireEvent.click(screen.getByRole("button", { name: "Near Start Branch" }));

    expect(screen.getByText("4 points")).not.toBeNull();
    expect(screen.getByText("Jewel Socket -> Precise Shot -> Projectile Damage -> Mercenary -> Near Start Branch")).not.toBeNull();
  });

  it("chains uncommitted preview paths from the current preview endpoint", async () => {
    stubTreeFetchWithGraph(endpointFixtureGraph());

    render(<App />);

    await screen.findByText("5 nodes, 4 links, version endpoint-fixture");

    fireEvent.click(screen.getByRole("button", { name: "Jewel Socket" }));

    expect(screen.getByText("3 points")).not.toBeNull();
    expect(screen.getByText("Mercenary -> Projectile Damage -> Precise Shot -> Jewel Socket")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Near Start Branch" }));

    expect(screen.getByText("Allocated 0 points")).not.toBeNull();
    expect(screen.getByText("7 points")).not.toBeNull();
    expect(screen.getByText("Mercenary -> Projectile Damage -> Precise Shot -> Jewel Socket -> Precise Shot -> Projectile Damage -> Mercenary -> Near Start Branch")).not.toBeNull();
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
