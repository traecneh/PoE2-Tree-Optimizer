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

  function mockSvgViewport(svg: SVGSVGElement, rect: Pick<DOMRect, "x" | "y" | "width" | "height">) {
    Object.defineProperty(svg, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        ...rect,
        top: rect.y,
        right: rect.x + rect.width,
        bottom: rect.y + rect.height,
        left: rect.x,
        toJSON: () => rect,
      }),
    });
  }

  it("resets the view after zooming", () => {
    render(<TreeViewer graph={sampleGraph} onSelectNode={vi.fn()} debug={debugOff} />);

    const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" });
    const transformLayer = svg.querySelector("g");

    expect(transformLayer?.getAttribute("transform")).toBe("translate(0 0) scale(1)");

    fireEvent.wheel(svg, { deltaY: -100 });

    expect(transformLayer?.getAttribute("transform")).toBe("translate(0 0) scale(1.1)");

    fireEvent.click(screen.getByRole("button", { name: "Fit tree" }));

    expect(transformLayer?.getAttribute("transform")).toBe("translate(0 0) scale(1)");
  });

  it("zooms with viewport controls and fits the tree", () => {
    render(<TreeViewer graph={sampleGraph} onSelectNode={vi.fn()} debug={debugOff} />);

    const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" }) as unknown as SVGSVGElement;
    const transformLayer = svg.querySelector("g");
    mockSvgCoordinateConversion(svg);
    mockSvgViewport(svg, { x: 0, y: 0, width: 400, height: 200 });

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));

    expect(transformLayer?.getAttribute("transform")).toBe("translate(-34 -17) scale(1.1)");

    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));

    expect(transformLayer?.getAttribute("transform")).toBe("translate(0 0) scale(1)");

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));

    expect(transformLayer?.getAttribute("transform")).toBe("translate(-34 -17) scale(1.1)");

    fireEvent.click(screen.getByRole("button", { name: "Fit tree" }));

    expect(transformLayer?.getAttribute("transform")).toBe("translate(0 0) scale(1)");
  });

  it("allows close inspection with a deeper zoom cap", () => {
    render(<TreeViewer graph={sampleGraph} onSelectNode={vi.fn()} debug={debugOff} />);

    const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" });
    const transformLayer = svg.querySelector("g");

    for (let i = 0; i < 32; i += 1) {
      fireEvent.wheel(svg, { deltaY: -100 });
    }

    expect(transformLayer?.getAttribute("transform")).toBe("translate(0 0) scale(18)");
  });

  it("zooms toward the wheel cursor position", () => {
    render(<TreeViewer graph={sampleGraph} onSelectNode={vi.fn()} debug={debugOff} />);

    const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" }) as unknown as SVGSVGElement;
    const transformLayer = svg.querySelector("g");
    mockSvgCoordinateConversion(svg);

    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 140, clientY: 120 });
    fireEvent.pointerUp(svg, { pointerId: 1 });

    fireEvent.wheel(svg, { deltaY: -100, clientX: 300, clientY: 200 });

    expect(transformLayer?.getAttribute("transform")).toBe("translate(23.8 3.4) scale(1.1)");
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

    fireEvent.click(screen.getByRole("button", { name: "Fit tree" }));

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

    expect(transformLayer?.getAttribute("transform")).toBe("translate(74.8 37.4) scale(1.1)");
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

  it("dims inactive ascendancy trees when a specific ascendancy is active", () => {
    const graph: TreeGraph = {
      ...sampleGraph,
      nodes: {
        gemling_start: {
          id: "gemling_start",
          name: "Gemling Start",
          stats: [],
          position: { x: 0, y: 0 },
          flags: { classStart: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary3",
            name: "Gemling Legionnaire",
            className: "Mercenary",
            disabled: false,
            startNode: true,
          },
        },
        gemling_passive: {
          id: "gemling_passive",
          name: "Gemling Passive",
          stats: ["10% increased Gem Power"],
          position: { x: 100, y: 0 },
          flags: { notable: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary3",
            name: "Gemling Legionnaire",
            className: "Mercenary",
            disabled: false,
          },
        },
        witchhunter_start: {
          id: "witchhunter_start",
          name: "Witchhunter Start",
          stats: [],
          position: { x: 0, y: 200 },
          flags: { classStart: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary1",
            name: "Witchhunter",
            className: "Mercenary",
            disabled: false,
            startNode: true,
          },
        },
        witchhunter_passive: {
          id: "witchhunter_passive",
          name: "Witchhunter Passive",
          stats: ["10% increased Witchhunter Power"],
          position: { x: 100, y: 200 },
          flags: { notable: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary1",
            name: "Witchhunter",
            className: "Mercenary",
            disabled: false,
          },
        },
        main_tree_passive: {
          id: "main_tree_passive",
          name: "Main Tree Passive",
          stats: ["10% increased Damage"],
          position: { x: 100, y: 400 },
          flags: { small: true },
        },
      },
      edges: [
        { from: "gemling_start", to: "gemling_passive" },
        { from: "witchhunter_start", to: "witchhunter_passive" },
        { from: "main_tree_passive", to: "gemling_passive" },
      ],
      groups: {},
      classStarts: {},
      bounds: { minX: 0, maxX: 100, minY: 0, maxY: 400 },
    };

    render(
      <TreeViewer
        graph={graph}
        activeAscendancyId="Mercenary3"
        onSelectNode={vi.fn()}
        debug={debugOff}
      />,
    );

    expect(document.querySelector(".tree-viewer")?.classList.contains("has-active-ascendancy")).toBe(true);
    expect(screen.getByRole("button", { name: "Gemling Passive" }).classList.contains("active-ascendancy")).toBe(true);
    expect(screen.getByRole("button", { name: "Witchhunter Passive" }).classList.contains("inactive-ascendancy")).toBe(true);
    expect(screen.getByRole("button", { name: "Main Tree Passive" }).classList.contains("inactive-ascendancy")).toBe(false);
    expect(document.querySelectorAll(".tree-edge.active-ascendancy-edge")).toHaveLength(1);
    expect(document.querySelectorAll(".tree-edge.inactive-ascendancy-edge")).toHaveLength(1);
  });

  it("renders the active ascendancy tree in the main tree center", () => {
    const graph: TreeGraph = {
      ...sampleGraph,
      nodes: {
        north_start: {
          id: "north_start",
          name: "North Start",
          stats: [],
          position: { x: 0, y: -100 },
          flags: { classStart: true },
        },
        south_start: {
          id: "south_start",
          name: "South Start",
          stats: [],
          position: { x: 0, y: 100 },
          flags: { classStart: true },
        },
        west_start: {
          id: "west_start",
          name: "West Start",
          stats: [],
          position: { x: -100, y: 0 },
          flags: { classStart: true },
        },
        east_start: {
          id: "east_start",
          name: "East Start",
          stats: [],
          position: { x: 100, y: 0 },
          flags: { classStart: true },
        },
        gemling_start: {
          id: "gemling_start",
          name: "Gemling Start",
          stats: [],
          position: { x: 1000, y: 1000 },
          flags: { classStart: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary3",
            name: "Gemling Legionnaire",
            className: "Mercenary",
            disabled: false,
            startNode: true,
          },
        },
        gemling_passive: {
          id: "gemling_passive",
          name: "Gemling Passive",
          stats: ["10% increased Gem Power"],
          position: { x: 1100, y: 1000 },
          flags: { notable: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary3",
            name: "Gemling Legionnaire",
            className: "Mercenary",
            disabled: false,
          },
        },
        witchhunter_start: {
          id: "witchhunter_start",
          name: "Witchhunter Start",
          stats: [],
          position: { x: 1000, y: 2000 },
          flags: { classStart: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary1",
            name: "Witchhunter",
            className: "Mercenary",
            disabled: false,
            startNode: true,
          },
        },
        witchhunter_passive: {
          id: "witchhunter_passive",
          name: "Witchhunter Passive",
          stats: ["10% increased Witchhunter Power"],
          position: { x: 1100, y: 2000 },
          flags: { notable: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary1",
            name: "Witchhunter",
            className: "Mercenary",
            disabled: false,
          },
        },
      },
      edges: [
        { from: "gemling_start", to: "gemling_passive" },
        { from: "witchhunter_start", to: "witchhunter_passive" },
      ],
      groups: {},
      classStarts: {
        North: "north_start",
        South: "south_start",
        West: "west_start",
        East: "east_start",
      },
      bounds: { minX: -100, maxX: 1100, minY: -100, maxY: 2000 },
    };

    render(
      <TreeViewer
        graph={graph}
        activeAscendancyId="Mercenary3"
        searchMatchNodeIds={new Set(["gemling_passive"])}
        onSelectNode={vi.fn()}
        debug={debugOff}
      />,
    );

    expect(screen.getByRole("button", { name: "Gemling Start" }).getAttribute("transform")).toBe("translate(-50 0)");
    expect(screen.getByRole("button", { name: "Gemling Passive" }).getAttribute("transform")).toBe("translate(50 0)");
    expect(screen.getByRole("button", { name: "Witchhunter Passive" }).getAttribute("transform")).toBe("translate(1100 2000)");
    expect(document.querySelector(".tree-edge.active-ascendancy-edge")?.getAttribute("d")).toBe("M -50 0 L 50 0");
    expect(document.querySelector(".search-match-node")?.getAttribute("transform")).toBe("translate(50 0)");
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

    expect(transformLayer?.getAttribute("transform")).toBe("translate(74.8 37.4) scale(1.1)");
    expect(updateCount).toBe(0);
  });

  it("keeps static search highlights cheap while the viewport is moving", () => {
    vi.useFakeTimers();
    let updateCount = 0;

    try {
      render(
        <Profiler id="tree-viewer" onRender={(_id, phase) => {
          if (phase === "update") updateCount += 1;
        }}>
          <TreeViewer
            graph={sampleGraph}
            searchMatchNodeIds={new Set(["precise_shot"])}
            onSelectNode={vi.fn()}
            debug={debugOff}
          />
        </Profiler>,
      );

      const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" }) as unknown as SVGSVGElement;
      const viewer = document.querySelector(".tree-viewer");
      mockSvgCoordinateConversion(svg);

      expect(screen.getByRole("button", { name: "Precise Shot" }).classList.contains("search-match")).toBe(false);
      expect(document.querySelectorAll(".search-highlight-layer .search-match-marker")).toHaveLength(1);
      expect(viewer?.classList.contains("viewport-moving")).toBe(false);

      fireEvent.wheel(svg, { deltaY: -100 });

      expect(viewer?.classList.contains("viewport-moving")).toBe(true);
      expect(updateCount).toBe(0);

      vi.advanceTimersByTime(180);

      expect(viewer?.classList.contains("viewport-moving")).toBe(false);

      fireEvent.pointerDown(svg, { pointerId: 1, clientX: 100, clientY: 100 });
      fireEvent.pointerMove(svg, { pointerId: 1, clientX: 140, clientY: 120 });

      expect(viewer?.classList.contains("viewport-moving")).toBe(true);
      expect(updateCount).toBe(0);
    } finally {
      vi.useRealTimers();
    }
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

  it("renders distinct visual layers for passive node types", () => {
    const graph: TreeGraph = {
      ...sampleGraph,
      nodes: {
        ...sampleGraph.nodes,
        mind_over_matter: {
          id: "mind_over_matter",
          groupId: "g3",
          name: "Mind over Matter",
          stats: ["Keystone passive skill"],
          position: { x: 480, y: -80 },
          flags: { keystone: true },
        },
        dexterity: {
          id: "dexterity",
          groupId: "g3",
          name: "Dexterity",
          stats: ["+5 to Dexterity"],
          position: { x: 520, y: 80 },
          flags: { attribute: true },
        },
      },
      groups: {
        ...sampleGraph.groups,
        g3: { id: "g3", position: { x: 500, y: 0 }, nodeIds: ["mind_over_matter", "dexterity"] },
      },
      bounds: { ...sampleGraph.bounds, maxX: 520, minY: -80 },
    };

    render(<TreeViewer graph={graph} onSelectNode={vi.fn()} debug={debugOff} />);

    const classStart = screen.getByRole("button", { name: "Mercenary" });
    const notable = screen.getByRole("button", { name: "Precise Shot" });
    const jewel = screen.getByRole("button", { name: "Jewel Socket" });
    const keystone = screen.getByRole("button", { name: "Mind over Matter" });
    const attribute = screen.getByRole("button", { name: "Dexterity" });

    expect(classStart.querySelector(".node-halo")).not.toBeNull();
    expect(classStart.querySelector(".node-frame")).not.toBeNull();
    expect(classStart.querySelector(".node-glyph.class-start-glyph")).not.toBeNull();
    expect(notable.querySelector(".node-glyph.notable-glyph")).not.toBeNull();
    expect(jewel.querySelector(".node-glyph.jewel-socket-glyph")).not.toBeNull();
    expect(keystone.querySelector(".node-glyph.keystone-glyph")).not.toBeNull();
    expect(attribute.classList.contains("node-accent-dexterity")).toBe(true);
    expect(attribute.querySelector(".node-glyph.attribute-glyph")).not.toBeNull();
  });

  it("renders a game icon image for nodes with passive icon art", () => {
    const graph: TreeGraph = {
      ...sampleGraph,
      nodes: {
        ...sampleGraph.nodes,
        precise_shot: {
          ...sampleGraph.nodes.precise_shot,
          art: { icon: "Art/2DArt/SkillIcons/passives/CriticalNotable.dds" },
        },
      },
    };

    render(<TreeViewer graph={graph} onSelectNode={vi.fn()} debug={debugOff} />);

    const node = screen.getByRole("button", { name: "Precise Shot" });
    const frame = node.querySelector(".node-frame");
    const core = node.querySelector(".node-core");
    const icon = node.querySelector(".node-icon");
    const iconClips = document.querySelectorAll(".node-icon-clip");
    const iconClipCircle = document.querySelector(".node-icon-clip circle");

    expect(frame?.getAttribute("r")).toBe("46");
    expect(core?.getAttribute("r")).toBe("36");
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute("href")).toBe("/tree-assets/icons/art-2dart-skillicons-passives-criticalnotable.png");
    expect(icon?.getAttribute("clip-path")).toBe("url(#tree-node-icon-clip)");
    expect(icon?.getAttribute("width")).toBe("79.2");
    expect(iconClips).toHaveLength(1);
    expect(iconClipCircle?.getAttribute("r")).toBe("0.454545");
    expect(node.querySelector(".node-glyph.notable-glyph")).toBeNull();
  });

  it("scales node visuals from the configured node scale", () => {
    const graph: TreeGraph = {
      ...sampleGraph,
      nodes: {
        ...sampleGraph.nodes,
        precise_shot: {
          ...sampleGraph.nodes.precise_shot,
          art: { icon: "Art/2DArt/SkillIcons/passives/CriticalNotable.dds" },
        },
      },
    };

    render(<TreeViewer graph={graph} nodeVisualScale={1.5} onSelectNode={vi.fn()} debug={debugOff} />);

    const node = screen.getByRole("button", { name: "Precise Shot" });

    expect(node.querySelector(".node-frame")?.getAttribute("r")).toBe("34.5");
    expect(node.querySelector(".node-core")?.getAttribute("r")).toBe("27");
    expect(node.querySelector(".node-icon")?.getAttribute("width")).toBe("59.4");
  });

  it("marks nodes that match the active search", () => {
    render(
      <TreeViewer
        graph={sampleGraph}
        searchMatchNodeIds={new Set(["precise_shot"])}
        onSelectNode={vi.fn()}
        debug={debugOff}
      />,
    );

    const matchingNode = screen.getByRole("button", { name: "Precise Shot" });
    const otherNode = screen.getByRole("button", { name: "Projectile Damage" });

    expect(matchingNode.classList.contains("search-match")).toBe(false);
    expect(document.querySelectorAll(".search-highlight-layer .search-match-marker")).toHaveLength(1);
    expect(otherNode.classList.contains("search-match")).toBe(false);
  });

  it("uses compact markers for passive search matches", () => {
    render(
      <TreeViewer
        graph={sampleGraph}
        searchMatchNodeIds={new Set(["precise_shot"])}
        onSelectNode={vi.fn()}
        debug={debugOff}
      />,
    );

    expect(document.querySelector(".search-match-marker")?.getAttribute("r")).toBe("60");
    expect(document.querySelector(".search-match-core-marker")?.getAttribute("r")).toBe("40");
  });

  it("paints search highlights behind node icons", () => {
    const graph: TreeGraph = {
      ...sampleGraph,
      nodes: {
        ...sampleGraph.nodes,
        precise_shot: {
          ...sampleGraph.nodes.precise_shot,
          art: { icon: "Art/2DArt/SkillIcons/passives/CriticalNotable.dds" },
        },
      },
    };

    render(
      <TreeViewer
        graph={graph}
        searchMatchNodeIds={new Set(["precise_shot"])}
        searchFocusedNodeId="precise_shot"
        onSelectNode={vi.fn()}
        debug={debugOff}
      />,
    );

    const viewportLayers = Array.from(document.querySelector(".tree-svg > g")?.children ?? [])
      .map((element) => element.getAttribute("class"));

    expect(viewportLayers.indexOf("search-highlight-layer")).toBeLessThan(viewportLayers.indexOf("node-layer"));
    expect(viewportLayers.indexOf("search-focus-highlight-layer")).toBeLessThan(viewportLayers.indexOf("node-layer"));
    expect(screen.getByRole("button", { name: "Precise Shot" }).querySelector(".node-icon")).not.toBeNull();
  });

  it("marks the focused search result with a distinct static map highlight", () => {
    render(
      <TreeViewer
        graph={sampleGraph}
        searchMatchNodeIds={new Set(["precise_shot"])}
        searchFocusedNodeId="precise_shot"
        onSelectNode={vi.fn()}
        debug={debugOff}
      />,
    );

    const focusedNode = screen.getByRole("button", { name: "Precise Shot" });
    const otherNode = screen.getByRole("button", { name: "Projectile Damage" });

    expect(focusedNode.classList.contains("search-focus")).toBe(false);
    expect(document.querySelectorAll(".search-focus-highlight-layer .search-focus-marker")).toHaveLength(1);
    expect(otherNode.classList.contains("search-focus")).toBe(false);
  });

  it("marks allocation path nodes and edges", () => {
    render(
      <TreeViewer
        graph={sampleGraph}
        allocationPathNodeIds={new Set(["mercenary_start", "projectile_damage", "precise_shot"])}
        allocationPathEdgeKeys={new Set(["mercenary_start::projectile_damage", "precise_shot::projectile_damage"])}
        onSelectNode={vi.fn()}
        debug={debugOff}
      />,
    );

    expect(screen.getByRole("button", { name: "Mercenary" }).classList.contains("allocation-path")).toBe(true);
    expect(screen.getByRole("button", { name: "Projectile Damage" }).classList.contains("allocation-path")).toBe(true);
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("allocation-path")).toBe(false);
    expect(document.querySelectorAll(".tree-edge.allocation-path")).toHaveLength(2);
    expect(document.querySelectorAll(".path-highlight-layer .allocation-path-edge")).toHaveLength(2);
  });

  it("marks committed allocated nodes and edges separately from the preview path", () => {
    render(
      <TreeViewer
        graph={sampleGraph}
        allocatedNodeIds={new Set(["mercenary_start", "projectile_damage"])}
        allocatedEdgeKeys={new Set(["mercenary_start::projectile_damage"])}
        allocationPathNodeIds={new Set(["projectile_damage", "precise_shot"])}
        allocationPathEdgeKeys={new Set(["precise_shot::projectile_damage"])}
        onSelectNode={vi.fn()}
        debug={debugOff}
      />,
    );

    expect(screen.getByRole("button", { name: "Mercenary" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByRole("button", { name: "Precise Shot" }).classList.contains("allocated")).toBe(false);
    expect(document.querySelectorAll(".tree-edge.allocated")).toHaveLength(1);
    expect(document.querySelectorAll(".allocated-highlight-layer .allocated-edge")).toHaveLength(1);
    expect(document.querySelectorAll(".path-highlight-layer .allocation-path-edge")).toHaveLength(1);
  });

  it("marks the selected path start independently from allocated nodes", () => {
    render(
      <TreeViewer
        graph={sampleGraph}
        pathStartNodeId="mercenary_start"
        allocatedNodeIds={new Set(["mercenary_start"])}
        onSelectNode={vi.fn()}
        debug={debugOff}
      />,
    );

    const pathStart = screen.getByRole("button", { name: "Mercenary" });
    const otherNode = screen.getByRole("button", { name: "Projectile Damage" });

    expect(pathStart.classList.contains("path-start")).toBe(true);
    expect(pathStart.querySelector(".path-start-marker")).not.toBeNull();
    expect(otherNode.classList.contains("path-start")).toBe(false);
    expect(otherNode.querySelector(".path-start-marker")).toBeNull();
  });

  it("marks selected targets that have no allocatable path", () => {
    render(
      <TreeViewer
        graph={sampleGraph}
        selectedNodeId="jewel_socket"
        noAllocationPathNodeId="jewel_socket"
        onSelectNode={vi.fn()}
        debug={debugOff}
      />,
    );

    const selectedNode = screen.getByRole("button", { name: "Jewel Socket" });
    const otherNode = screen.getByRole("button", { name: "Mercenary" });

    expect(selectedNode.classList.contains("no-allocation-path")).toBe(true);
    expect(selectedNode.querySelector(".no-path-marker")).not.toBeNull();
    expect(otherNode.classList.contains("no-allocation-path")).toBe(false);
  });

  it("marks the selected map node with a prominent target ring", () => {
    render(
      <TreeViewer
        graph={sampleGraph}
        selectedNodeId="precise_shot"
        onSelectNode={vi.fn()}
        debug={debugOff}
      />,
    );

    const selectedNode = screen.getByRole("button", { name: "Precise Shot" });
    const otherNode = screen.getByRole("button", { name: "Projectile Damage" });

    expect(selectedNode.querySelector(".target-marker")).not.toBeNull();
    expect(otherNode.querySelector(".target-marker")).toBeNull();
  });

  it("gives map nodes an expanded pointer hit target", () => {
    render(<TreeViewer graph={sampleGraph} onSelectNode={vi.fn()} debug={debugOff} />);

    const node = screen.getByRole("button", { name: "Projectile Damage" });
    const hitTarget = node.querySelector(".node-hit-target");
    const frame = node.querySelector(".node-frame");

    expect(Number(hitTarget?.getAttribute("r"))).toBeGreaterThan(Number(frame?.getAttribute("r")));
  });

  it("selects a node when the pointer press starts on it and releases on the viewer", () => {
    const onSelectNode = vi.fn();

    render(<TreeViewer graph={sampleGraph} onSelectNode={onSelectNode} debug={debugOff} />);

    const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" }) as unknown as SVGSVGElement;
    const node = screen.getByRole("button", { name: "Precise Shot" });
    mockSvgCoordinateConversion(svg);

    fireEvent.pointerDown(node, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(svg, { pointerId: 1 });

    expect(onSelectNode).toHaveBeenCalledWith("precise_shot");
  });

  it("adds a build goal instead of selecting when Ctrl-clicking a node", () => {
    const onSelectNode = vi.fn();
    const onAddBuildGoal = vi.fn();

    render(
      <TreeViewer
        graph={sampleGraph}
        onSelectNode={onSelectNode}
        onAddBuildGoal={onAddBuildGoal}
        debug={debugOff}
      />,
    );

    const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" }) as unknown as SVGSVGElement;
    const node = screen.getByRole("button", { name: "Projectile Damage" });
    mockSvgCoordinateConversion(svg);

    fireEvent.pointerDown(node, { pointerId: 1, button: 0, clientX: 100, clientY: 100, ctrlKey: true });
    fireEvent.pointerUp(svg, { pointerId: 1 });

    expect(onAddBuildGoal).toHaveBeenCalledWith("projectile_damage");
    expect(onSelectNode).not.toHaveBeenCalled();
  });

  it("does not add a build goal after dragging from a Ctrl-clicked node", () => {
    const onAddBuildGoal = vi.fn();

    render(
      <TreeViewer
        graph={sampleGraph}
        onSelectNode={vi.fn()}
        onAddBuildGoal={onAddBuildGoal}
        debug={debugOff}
      />,
    );

    const svg = screen.getByRole("img", { name: "PoE2 passive skill tree" }) as unknown as SVGSVGElement;
    const node = screen.getByRole("button", { name: "Projectile Damage" });
    mockSvgCoordinateConversion(svg);

    fireEvent.pointerDown(node, { pointerId: 1, button: 0, clientX: 100, clientY: 100, ctrlKey: true });
    fireEvent.pointerMove(node, { pointerId: 1, clientX: 120, clientY: 100, ctrlKey: true });
    fireEvent.pointerUp(node, { pointerId: 1 });
    fireEvent.click(node, { ctrlKey: true });

    expect(onAddBuildGoal).not.toHaveBeenCalled();
  });

  it("shows a passive tooltip while hovering a node", () => {
    render(<TreeViewer graph={sampleGraph} onSelectNode={vi.fn()} debug={debugOff} />);

    expect(screen.queryByRole("tooltip")).toBeNull();

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Precise Shot" }), { clientX: 220, clientY: 140 });

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.textContent).toContain("Precise Shot");
    expect(tooltip.textContent).toContain("25% increased Critical Hit Chance");
    expect(tooltip.textContent).toContain("Unallocated");

    fireEvent.mouseLeave(screen.getByRole("button", { name: "Precise Shot" }));

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("shows mastery choices in the node tooltip", () => {
    const graph = {
      ...sampleGraph,
      nodes: {
        ...sampleGraph.nodes,
        mastery: {
          id: "mastery",
          name: "Attack Mastery",
          stats: [],
          masteryEffects: [
            { id: "Attack1", stats: ["12% increased Attack Damage"] },
            { id: "Attack2", stats: ["20% increased Accuracy Rating", "5% increased Attack Speed"] },
          ],
          position: { x: 480, y: 180 },
          flags: { small: true, mastery: true },
        },
      },
      bounds: { ...sampleGraph.bounds, maxX: 480, maxY: 180 },
    };

    render(<TreeViewer graph={graph} onSelectNode={vi.fn()} debug={debugOff} />);

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Attack Mastery" }), { clientX: 220, clientY: 140 });

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.textContent).toContain("Attack Mastery");
    expect(tooltip.textContent).toContain("Mastery choices");
    expect(tooltip.textContent).toContain("12% increased Attack Damage");
    expect(tooltip.textContent).toContain("20% increased Accuracy Rating");
    expect(tooltip.textContent).toContain("5% increased Attack Speed");
  });

  it("shows and hides hover tooltips without a React commit", () => {
    let updateCount = 0;

    render(
      <Profiler id="tree-viewer" onRender={(_id, phase) => {
        if (phase === "update") updateCount += 1;
      }}>
        <TreeViewer graph={sampleGraph} onSelectNode={vi.fn()} debug={debugOff} />
      </Profiler>,
    );

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Precise Shot" }), { clientX: 220, clientY: 140 });

    expect(screen.getByRole("tooltip").textContent).toContain("Precise Shot");

    fireEvent.mouseLeave(screen.getByRole("button", { name: "Precise Shot" }));

    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(updateCount).toBe(0);
  });

  it("shows a passive tooltip while keyboard focusing a node", () => {
    render(<TreeViewer graph={sampleGraph} onSelectNode={vi.fn()} debug={debugOff} />);

    fireEvent.focus(screen.getByRole("button", { name: "Jewel Socket" }));

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.textContent).toContain("Jewel Socket");
    expect(tooltip.textContent).toContain("Jewel socket");
  });

  it("shows a passive tooltip when keyboard selecting a node", () => {
    render(<TreeViewer graph={sampleGraph} onSelectNode={vi.fn()} debug={debugOff} />);

    fireEvent.keyDown(screen.getByRole("button", { name: "Precise Shot" }), { key: "Enter" });

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.textContent).toContain("Precise Shot");
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

  it("keeps selected node visuals above debug overlay rings", () => {
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
      "node-hit-target",
      "debug-ring orphan-ring",
      "debug-ring missing-stats-ring",
      "target-marker",
      "node-frame",
      "node-core",
    ]);
  });
});
