import { fireEvent, render, screen } from "@testing-library/react";
import { Profiler } from "react";
import { describe, expect, it, vi } from "vitest";
import { sampleGraph } from "../tree/sampleGraph";
import type { TreeGraph } from "../tree/types";
import { TreeViewer } from "./TreeViewer";

describe("TreeViewer", () => {
  const debugOff = {
    showNodeIds: false,
    highlightMissingStats: false,
    highlightOrphans: false,
    showEdgeRoutes: false,
    showEdgeRouteLabels: false,
  };

  function mockSvgCoordinateConversion(svg: SVGSVGElement, scale = 1.7) {
    Object.defineProperties(svg, {
      createSVGPoint: {
        configurable: true,
        value: () => ({
          x: 0,
          y: 0,
          matrixTransform(matrix: { scale: number }) {
            return { x: this.x * matrix.scale, y: this.y * matrix.scale };
          },
        }),
      },
      getScreenCTM: {
        configurable: true,
        value: () => ({
          inverse: () => ({ scale }),
        }),
      },
    });
  }

  it("resets the view after zooming", () => {
    render(<TreeViewer graph={sampleGraph} onSelectNode={vi.fn()} debug={debugOff} />);

    const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" });
    const transformLayer = svg.querySelector("g");

    expect(transformLayer?.getAttribute("transform")).toBe("translate(0 0) scale(1)");

    fireEvent.wheel(svg, { deltaY: -100 });

    expect(transformLayer?.getAttribute("transform")).toBe("translate(0 0) scale(1.1)");

    fireEvent.click(screen.getByRole("button", { name: "Reset View" }));

    expect(transformLayer?.getAttribute("transform")).toBe("translate(0 0) scale(1)");
  });

  it("allows close inspection with a deeper zoom cap", () => {
    render(<TreeViewer graph={sampleGraph} onSelectNode={vi.fn()} debug={debugOff} />);

    const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" });
    const transformLayer = svg.querySelector("g");

    for (let i = 0; i < 32; i += 1) {
      fireEvent.wheel(svg, { deltaY: -100 });
    }

    expect(transformLayer?.getAttribute("transform")).toBe("translate(0 0) scale(12)");
  });

  it("pans in viewBox units and resets the pan", () => {
    render(<TreeViewer graph={sampleGraph} onSelectNode={vi.fn()} debug={debugOff} />);

    const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" }) as unknown as SVGSVGElement;
    const transformLayer = svg.querySelector("g");
    mockSvgCoordinateConversion(svg);

    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 140, clientY: 120 });
    fireEvent.pointerUp(svg, { pointerId: 1 });

    expect(transformLayer?.getAttribute("transform")).toBe("translate(68 34) scale(1)");

    fireEvent.click(screen.getByRole("button", { name: "Reset View" }));

    expect(transformLayer?.getAttribute("transform")).toBe("translate(0 0) scale(1)");
  });

  it("keeps pan distance consistent after zooming", () => {
    render(<TreeViewer graph={sampleGraph} onSelectNode={vi.fn()} debug={debugOff} />);

    const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" }) as unknown as SVGSVGElement;
    const transformLayer = svg.querySelector("g");
    mockSvgCoordinateConversion(svg);

    fireEvent.wheel(svg, { deltaY: -100 });
    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 144, clientY: 122 });
    fireEvent.pointerUp(svg, { pointerId: 1 });

    expect(transformLayer?.getAttribute("transform")).toBe("translate(68 34) scale(1.1)");
  });

  it("does not draw class-start to ascendancy-start edges", () => {
    const graph: TreeGraph = {
      ...sampleGraph,
      nodes: {
        central_start: {
          id: "central_start",
          name: "Central Start",
          stats: [],
          position: { x: 0, y: 0 },
          flags: { classStart: true },
        },
        nearby_passive: {
          id: "nearby_passive",
          name: "Nearby Passive",
          stats: ["10% increased Damage"],
          position: { x: 100, y: 0 },
          flags: { small: true },
        },
        ascendancy_start: {
          id: "ascendancy_start",
          name: "Ascendancy Start",
          stats: [],
          position: { x: 5000, y: 0 },
          flags: { classStart: true },
        },
      },
      edges: [
        { from: "central_start", to: "nearby_passive" },
        { from: "central_start", to: "ascendancy_start" },
      ],
      groups: {},
      classStarts: { Test: "central_start" },
      bounds: { minX: 0, maxX: 5000, minY: 0, maxY: 0 },
    };

    render(<TreeViewer graph={graph} onSelectNode={vi.fn()} debug={debugOff} />);

    const paths = Array.from(document.querySelectorAll(".tree-edge"));

    expect(paths).toHaveLength(1);
    expect(paths[0].getAttribute("d")).toBe("M 0 0 L 100 0");
  });

  it("does not draw long guide edges from outside ascendancy path nodes back to class starts", () => {
    const graph: TreeGraph = {
      ...sampleGraph,
      nodes: {
        central_start_neighbor: {
          id: "central_start_neighbor",
          name: "Melee Damage",
          stats: ["10% increased Melee Damage"],
          position: { x: 0, y: 0 },
          flags: { small: true },
        },
        nearby_passive: {
          id: "nearby_passive",
          name: "Nearby Passive",
          stats: ["10% increased Damage"],
          position: { x: 100, y: 0 },
          flags: { small: true },
        },
        outside_path_node: {
          id: "outside_path_node",
          name: "Path of the Warrior",
          stats: [],
          position: { x: 18000, y: 0 },
          flags: { small: true },
        },
      },
      edges: [
        { from: "central_start_neighbor", to: "nearby_passive" },
        { from: "central_start_neighbor", to: "outside_path_node" },
      ],
      groups: {},
      classStarts: {},
      bounds: { minX: 0, maxX: 18000, minY: 0, maxY: 0 },
    };

    render(<TreeViewer graph={graph} onSelectNode={vi.fn()} debug={debugOff} />);

    const paths = Array.from(document.querySelectorAll(".tree-edge"));

    expect(paths).toHaveLength(1);
    expect(paths[0].getAttribute("d")).toBe("M 0 0 L 100 0");
  });

  it("draws same-orbit group edges as arcs", () => {
    const graph: TreeGraph = {
      ...sampleGraph,
      nodes: {
        east: {
          id: "east",
          groupId: "g1",
          name: "East",
          stats: [],
          position: { x: 100, y: 0 },
          flags: { small: true },
        },
        south: {
          id: "south",
          groupId: "g1",
          name: "South",
          stats: [],
          position: { x: 0, y: 100 },
          flags: { small: true },
        },
      },
      edges: [{ from: "east", to: "south" }],
      groups: { g1: { id: "g1", position: { x: 0, y: 0 }, nodeIds: ["east", "south"] } },
      classStarts: {},
      bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
    };

    render(<TreeViewer graph={graph} onSelectNode={vi.fn()} debug={debugOff} />);

    expect(document.querySelector(".tree-edge")?.getAttribute("d")).toBe("M 100 0 A 100 100 0 0 1 0 100");
  });

  it("marks edge route classes and metadata when route debugging is enabled", () => {
    const graph: TreeGraph = {
      ...sampleGraph,
      nodes: {
        a: {
          id: "a",
          name: "A",
          stats: [],
          position: { x: 0, y: 0 },
          flags: { small: true },
        },
        b: {
          id: "b",
          name: "B",
          stats: [],
          position: { x: 100, y: 0 },
          flags: { small: true },
        },
        c: {
          id: "c",
          name: "C",
          stats: [],
          position: { x: 200, y: 0 },
          flags: { small: true },
        },
      },
      edges: [
        { from: "a", to: "b", connectionOrbit: 3 },
        { from: "b", to: "c", connectionOrbit: -3 },
      ],
      groups: {},
      classStarts: {},
      bounds: { minX: 0, maxX: 200, minY: 0, maxY: 0 },
    };

    render(
      <TreeViewer
        graph={graph}
        onSelectNode={vi.fn()}
        debug={{ ...debugOff, showEdgeRoutes: true }}
      />,
    );

    const paths = Array.from(document.querySelectorAll(".tree-edge"));
    expect(paths[0].classList.contains("edge-route-positive")).toBe(true);
    expect(paths[0].getAttribute("data-route-orbit")).toBe("3");
    expect(paths[1].classList.contains("edge-route-negative")).toBe(true);
    expect(paths[1].getAttribute("data-route-orbit")).toBe("-3");
  });

  it("labels non-zero routed edges when route labels are enabled", () => {
    const graph: TreeGraph = {
      ...sampleGraph,
      nodes: {
        a: {
          id: "a",
          name: "A",
          stats: [],
          position: { x: 0, y: 0 },
          flags: { small: true },
        },
        b: {
          id: "b",
          name: "B",
          stats: [],
          position: { x: 100, y: 0 },
          flags: { small: true },
        },
        c: {
          id: "c",
          name: "C",
          stats: [],
          position: { x: 200, y: 0 },
          flags: { small: true },
        },
      },
      edges: [
        { from: "a", to: "b", connectionOrbit: 3 },
        { from: "b", to: "c", connectionOrbit: 0 },
      ],
      groups: {},
      classStarts: {},
      bounds: { minX: 0, maxX: 200, minY: 0, maxY: 0 },
    };

    render(
      <TreeViewer
        graph={graph}
        onSelectNode={vi.fn()}
        debug={{ ...debugOff, showEdgeRoutes: true, showEdgeRouteLabels: true }}
      />,
    );

    expect(screen.getByText("+3").classList.contains("edge-route-label")).toBe(true);
    expect(document.querySelectorAll(".edge-route-label")).toHaveLength(1);
  });

  it("updates the viewport transform without React commits during pan and zoom", () => {
    let updateCount = 0;

    render(
      <Profiler id="tree-viewer" onRender={(_id, phase) => {
        if (phase === "update") updateCount += 1;
      }}>
        <TreeViewer graph={sampleGraph} onSelectNode={vi.fn()} debug={debugOff} />
      </Profiler>,
    );

    const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" }) as unknown as SVGSVGElement;
    const transformLayer = svg.querySelector("g");
    mockSvgCoordinateConversion(svg);

    fireEvent.wheel(svg, { deltaY: -100 });
    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 144, clientY: 122 });
    fireEvent.pointerUp(svg, { pointerId: 1 });

    expect(transformLayer?.getAttribute("transform")).toBe("translate(68 34) scale(1.1)");
    expect(updateCount).toBe(0);
  });

  it("does not pan below the drag threshold", () => {
    render(<TreeViewer graph={sampleGraph} onSelectNode={vi.fn()} debug={debugOff} />);

    const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" }) as unknown as SVGSVGElement;
    const transformLayer = svg.querySelector("g");
    mockSvgCoordinateConversion(svg);

    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 103, clientY: 100 });
    fireEvent.pointerUp(svg, { pointerId: 1 });

    expect(transformLayer?.getAttribute("transform")).toBe("translate(0 0) scale(1)");
  });

  it("does not select a node after dragging from it", () => {
    const onSelectNode = vi.fn();

    render(<TreeViewer graph={sampleGraph} onSelectNode={onSelectNode} debug={debugOff} />);

    const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" }) as unknown as SVGSVGElement;
    const node = screen.getByRole("button", { name: "Mercenary" });
    mockSvgCoordinateConversion(svg);

    fireEvent.pointerDown(node, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(node, { pointerId: 1, clientX: 120, clientY: 100 });
    fireEvent.pointerUp(node, { pointerId: 1 });
    fireEvent.click(node);

    expect(onSelectNode).not.toHaveBeenCalled();
  });

  it("selects a focused node with Enter or Space", () => {
    const onSelectNode = vi.fn();

    render(<TreeViewer graph={sampleGraph} onSelectNode={onSelectNode} debug={debugOff} />);

    const node = screen.getByRole("button", { name: "Mercenary" });
    expect(node.getAttribute("tabindex")).toBe("0");

    fireEvent.keyDown(node, { key: "Enter" });
    fireEvent.keyDown(node, { key: " " });

    expect(onSelectNode).toHaveBeenNthCalledWith(1, "mercenary_start");
    expect(onSelectNode).toHaveBeenNthCalledWith(2, "mercenary_start");
  });

  it("renders node id labels when the debug overlay is enabled", () => {
    render(
      <TreeViewer
        graph={sampleGraph}
        onSelectNode={vi.fn()}
        debug={{ ...debugOff, showNodeIds: true }}
      />,
    );

    expect(screen.getByText("mercenary_start").classList.contains("node-id-label")).toBe(true);
  });

  it("marks nodes missing stats and orphan nodes when debug overlays are enabled", () => {
    const graph = {
      ...sampleGraph,
      nodes: {
        ...sampleGraph.nodes,
        missing_stats: {
          id: "missing_stats",
          groupId: "g3",
          name: "Missing Stats",
          stats: [],
          position: { x: 480, y: 120 },
          flags: { small: true },
        },
      },
      bounds: { ...sampleGraph.bounds, maxX: 480, maxY: 120 },
    };

    render(
      <TreeViewer
        graph={graph}
        onSelectNode={vi.fn()}
        debug={{ ...debugOff, highlightMissingStats: true, highlightOrphans: true }}
      />,
    );

    const node = screen.getByRole("button", { name: "Missing Stats" });
    expect(node.classList.contains("missing-stats")).toBe(true);
    expect(node.classList.contains("orphan-node")).toBe(true);
  });

  it("keeps selected node core above debug overlay rings", () => {
    const graph = {
      ...sampleGraph,
      nodes: {
        ...sampleGraph.nodes,
        missing_stats: {
          id: "missing_stats",
          groupId: "g3",
          name: "Missing Stats",
          stats: [],
          position: { x: 480, y: 120 },
          flags: { small: true },
        },
      },
      bounds: { ...sampleGraph.bounds, maxX: 480, maxY: 120 },
    };

    render(
      <TreeViewer
        graph={graph}
        selectedNodeId="missing_stats"
        onSelectNode={vi.fn()}
        debug={{ ...debugOff, highlightMissingStats: true, highlightOrphans: true }}
      />,
    );

    const node = screen.getByRole("button", { name: "Missing Stats" });
    const circles = Array.from(node.querySelectorAll("circle"));

    expect(node.classList.contains("selected")).toBe(true);
    expect(circles.map((circle) => circle.getAttribute("class"))).toEqual([
      "debug-ring orphan-ring",
      "debug-ring missing-stats-ring",
      "node-core",
    ]);
  });
});
