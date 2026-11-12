import { act, fireEvent, render, screen } from "@testing-library/react";
import { Profiler } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sampleGraph } from "../tree/sampleGraph";
import type { TreeGraph, TreeNode } from "../tree/types";
import { TreeViewer } from "./TreeViewer";
import { ascendancyInspectionLeaveDelayMs } from "./useAscendancyInspection";

const debug = { showNodeIds: false, highlightMissingStats: false, highlightOrphans: false, showEdgeRoutes: false, showEdgeRouteLabels: false };
function fixture(): TreeGraph {
  const ascendancy = (id: string, name: string, x: number, tree: string, start = false): TreeNode => ({
    id, name, position: { x, y: 2000 }, stats: ["10% increased Damage"], flags: { ascendancy: true, classStart: start, notable: !start },
    ascendancy: { id: tree, name: tree === "A" ? "Alpha" : "Beta", className: "Mercenary", disabled: false, startNode: start },
  });
  return { ...sampleGraph, nodes: { ...sampleGraph.nodes,
    a1: ascendancy("a1", "Alpha start", 2000, "A", true), a2: ascendancy("a2", "Alpha notable", 2400, "A"),
    b1: ascendancy("b1", "Beta start", -2000, "B", true), b2: ascendancy("b2", "Beta notable", -2400, "B"),
  }, edges: [...sampleGraph.edges, { from: "a1", to: "a2" }, { from: "b1", to: "b2" }],
    bounds: { minX: -2400, maxX: 2400, minY: -40, maxY: 2000 } };
}
const viewer = () => document.querySelector<HTMLElement>(".tree-viewer")!;
const region = (id = "A") => document.querySelector<SVGRectElement>(`.ascendancy-inspection-hit[data-ascendancy-id='${id}']`)!;
const node = (name = "Alpha notable") => screen.getByRole("button", { name });

afterEach(() => vi.useRealTimers());

describe("ascendancy inspection", () => {
  it.each([["Witch", "Sorceress"], ["Huntress", "Ranger"]])("highlights %s options separately from %s despite sharing a root", (firstClass, secondClass) => {
    const graph = fixture();
    for (const n of Object.values(graph.nodes)) {
      if (n.ascendancy) n.ascendancy.className = n.ascendancy.id === "A" ? firstClass : secondClass;
    }
    const props = { graph, debug, onSelectNode: vi.fn(), pathStartNodeId: "mercenary_start", searchMatchNodeIds: new Set(["a2", "b2"]), searchFocusedNodeId: "a2" };
    const { rerender } = render(<TreeViewer {...props} pathStartClassName={` ${firstClass.toLowerCase()} `} />);
    expect(node().classList.contains("class-ascendancy")).toBe(true);
    expect(node("Beta notable").classList.contains("class-ascendancy")).toBe(false);
    expect(document.querySelectorAll(".tree-edge.class-ascendancy-edge")).toHaveLength(1);
    expect(document.querySelector(".tree-edge.class-ascendancy-edge")?.getAttribute("data-ascendancy-id")).toBe("A");
    expect(document.querySelector(".search-match-node[data-ascendancy-id='A']")?.classList.contains("class-ascendancy")).toBe(true);
    expect(document.querySelector(".search-focus-node")?.classList.contains("class-ascendancy")).toBe(true);
    rerender(<TreeViewer {...props} pathStartClassName={secondClass} />);
    expect(node().classList.contains("class-ascendancy")).toBe(false);
    expect(node("Beta notable").classList.contains("class-ascendancy")).toBe(true);
    expect(document.querySelector(".tree-edge.class-ascendancy-edge")?.getAttribute("data-ascendancy-id")).toBe("B");
    expect(props.onSelectNode).not.toHaveBeenCalled();
  });

  it("keeps class highlighting after hover ends without changing the selected build", () => {
    vi.useFakeTimers();
    const select = vi.fn();
    render(<TreeViewer graph={fixture()} debug={debug} pathStartClassName="Mercenary" onSelectNode={select} />);
    fireEvent.pointerOver(region(), { pointerType: "mouse" });
    expect(node().classList.contains("ascendancy-inspected")).toBe(true);
    fireEvent.pointerOut(region(), { pointerType: "mouse", relatedTarget: screen.getByRole("img") });
    act(() => { vi.advanceTimersByTime(ascendancyInspectionLeaveDelayMs); });
    expect(node().classList.contains("ascendancy-inspected")).toBe(false);
    expect(node().classList.contains("class-ascendancy")).toBe(true);
    expect(select).not.toHaveBeenCalled();
  });

  it("removes the class-only boost when a specific ascendancy is selected", () => {
    const graph = fixture();
    const props = { graph, debug, onSelectNode: vi.fn(), pathStartClassName: "Mercenary" };
    const { rerender } = render(<TreeViewer {...props} />);
    expect(document.querySelectorAll(".tree-node.class-ascendancy")).toHaveLength(4);
    rerender(<TreeViewer {...props} activeAscendancyId="A" />);
    expect(document.querySelectorAll(".class-ascendancy, .class-ascendancy-edge")).toHaveLength(0);
    expect(node().classList.contains("active-ascendancy")).toBe(true);
    expect(node("Beta notable").classList.contains("inactive-ascendancy")).toBe(true);
  });

  it("fades every outer tree without a selected ascendancy and keeps all nodes available", () => {
    render(<TreeViewer graph={fixture()} debug={debug} onSelectNode={vi.fn()} />);
    expect(document.querySelectorAll(".tree-node.inactive-ascendancy")).toHaveLength(4);
    expect(document.querySelectorAll(".tree-edge.inactive-ascendancy-edge")).toHaveLength(2);
    expect(document.querySelectorAll(".ascendancy-inspection-hit")).toHaveLength(2);
    expect(node().classList.contains("inactive-ascendancy")).toBe(true);
    expect(viewer().dataset.inspectedAscendancy).toBeUndefined();
  });

  it("brightens only the hovered cluster, its lines and search markers without React commits", () => {
    const commits = vi.fn(), select = vi.fn(), hover = vi.fn();
    render(<Profiler id="tree" onRender={commits}><TreeViewer graph={fixture()} debug={debug} onSelectNode={select} onHoverNode={hover}
      searchMatchNodeIds={new Set(["a2"])} /></Profiler>);
    const before = commits.mock.calls.length;
    fireEvent.pointerOver(node(), { pointerType: "mouse" });
    expect(document.querySelectorAll(".tree-node.ascendancy-inspected")).toHaveLength(2);
    expect(document.querySelectorAll(".tree-edge.ascendancy-inspected")).toHaveLength(1);
    expect(document.querySelector(".search-match-node")?.classList.contains("ascendancy-inspected")).toBe(true);
    expect(viewer().dataset.inspectedAscendancy).toBe("A");
    expect(screen.getByRole("status").textContent).toBe("Mercenary - Alpha");
    fireEvent.mouseEnter(node(), { clientX: 150, clientY: 150 });
    expect(screen.getByRole("tooltip").textContent).toContain("10% increased Damage");
    expect(hover).toHaveBeenLastCalledWith(undefined);
    expect(select).not.toHaveBeenCalled();
    expect(commits.mock.calls.length).toBe(before);
  });

  it("keeps gaps and connections bright, switches clusters immediately and delays fading on exit", () => {
    vi.useFakeTimers();
    render(<TreeViewer graph={fixture()} debug={debug} onSelectNode={vi.fn()} />);
    fireEvent.pointerOver(region(), { pointerType: "mouse" });
    fireEvent.pointerOut(region(), { pointerType: "mouse", relatedTarget: node() });
    expect(viewer().dataset.inspectedAscendancy).toBe("A");
    const line = document.querySelector(".tree-edge[data-ascendancy-id='A']")!;
    fireEvent.pointerOver(line, { pointerType: "mouse" });
    expect(viewer().dataset.inspectedAscendancy).toBe("A");
    fireEvent.pointerOver(region("B"), { pointerType: "mouse" });
    expect(viewer().dataset.inspectedAscendancy).toBe("B");
    expect(node().classList.contains("ascendancy-inspected")).toBe(false);
    fireEvent.pointerOut(region("B"), { pointerType: "mouse", relatedTarget: screen.getByRole("img") });
    act(() => { vi.advanceTimersByTime(ascendancyInspectionLeaveDelayMs - 1); });
    expect(viewer().dataset.inspectedAscendancy).toBe("B");
    act(() => { vi.advanceTimersByTime(1); });
    expect(viewer().dataset.inspectedAscendancy).toBeUndefined();
    expect(document.querySelector<HTMLElement>(".ascendancy-inspection-name")?.hidden).toBe(true);
  });

  it("supports keyboard inspection without allocating, including Enter and Space", () => {
    const select = vi.fn();
    render(<TreeViewer graph={fixture()} debug={debug} onSelectNode={select} />);
    fireEvent.keyDown(document, { key: "Tab" });
    fireEvent.focus(node());
    expect(viewer().dataset.inspectedAscendancy).toBe("A");
    fireEvent.keyDown(node(), { key: "Enter" });
    fireEvent.keyDown(node(), { key: " " });
    expect(select).not.toHaveBeenCalled();
    fireEvent.blur(node(), { relatedTarget: screen.getByRole("button", { name: "Projectile Damage" }) });
    expect(viewer().dataset.inspectedAscendancy).toBeUndefined();
    fireEvent.focus(region("B"));
    expect(viewer().dataset.inspectedAscendancy).toBe("B");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(viewer().dataset.inspectedAscendancy).toBeUndefined();
  });

  it("does not postpone fading while the pointer keeps moving outside a cluster", () => {
    vi.useFakeTimers();
    render(<TreeViewer graph={fixture()} debug={debug} onSelectNode={vi.fn()} />);
    const svg = screen.getByRole("img");
    fireEvent.pointerOver(region(), { pointerType: "mouse" });
    fireEvent.pointerOut(region(), { pointerType: "mouse", relatedTarget: svg });
    act(() => { vi.advanceTimersByTime(80); });
    fireEvent.pointerMove(svg, { pointerType: "mouse", clientX: 10, clientY: 10 });
    act(() => { vi.advanceTimersByTime(40); });
    expect(viewer().dataset.inspectedAscendancy).toBeUndefined();
  });

  it("lets mouse and touch take over an old keyboard or pointer inspection", () => {
    render(<TreeViewer graph={fixture()} debug={debug} onSelectNode={vi.fn()} />);
    fireEvent.keyDown(document, { key: "Tab" });
    fireEvent.focus(node());
    fireEvent.pointerOver(region("B"), { pointerType: "mouse" });
    expect(viewer().dataset.inspectedAscendancy).toBe("B");
    fireEvent.pointerDown(region(), { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 100 });
    fireEvent.pointerUp(screen.getByRole("img"), { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 100 });
    expect(viewer().dataset.inspectedAscendancy).toBe("A");
  });

  it("pins touch inspection until tapping elsewhere and never adds a goal or allocates", () => {
    const select = vi.fn(), addGoal = vi.fn();
    render(<TreeViewer graph={fixture()} debug={debug} onSelectNode={select} onAddBuildGoal={addGoal} />);
    fireEvent.pointerDown(node(), { pointerId: 1, pointerType: "touch", button: 0, clientX: 100, clientY: 100, ctrlKey: true });
    fireEvent.pointerUp(screen.getByRole("img"), { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 100 });
    fireEvent.pointerLeave(screen.getByRole("img"), { pointerType: "touch" });
    expect(viewer().dataset.inspectedAscendancy).toBe("A");
    expect(select).not.toHaveBeenCalled();
    expect(addGoal).not.toHaveBeenCalled();
    expect(screen.getByRole("tooltip").textContent).toContain("Alpha notable");
    fireEvent.pointerDown(region("B"), { pointerId: 2, pointerType: "touch", clientX: 100, clientY: 100 });
    fireEvent.pointerUp(screen.getByRole("img"), { pointerId: 2, pointerType: "touch", clientX: 100, clientY: 100 });
    expect(viewer().dataset.inspectedAscendancy).toBe("B");
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.pointerDown(document.body, { pointerType: "touch" });
    expect(viewer().dataset.inspectedAscendancy).toBeUndefined();
    expect((screen.queryByRole("tooltip"))?.hasAttribute("hidden") ?? true).toBe(true);
  });

  it("does not pin an outer tree while panning from its hit area", () => {
    render(<TreeViewer graph={fixture()} debug={debug} onSelectNode={vi.fn()} />);
    const svg = screen.getByRole("img");
    fireEvent.pointerDown(region(), { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 100 });
    fireEvent.pointerMove(svg, { pointerId: 1, pointerType: "touch", clientX: 160, clientY: 140 });
    fireEvent.pointerUp(svg, { pointerId: 1, pointerType: "touch", clientX: 160, clientY: 140 });
    expect(viewer().dataset.inspectedAscendancy).toBeUndefined();
    expect(svg.querySelector("g")?.getAttribute("transform")).toBe("translate(60 40) scale(1)");
  });

  it("preserves active center allocation and clears old inspection when Path start changes", () => {
    const graph = fixture(), select = vi.fn();
    const { rerender } = render(<TreeViewer graph={graph} debug={debug} onSelectNode={select} />);
    fireEvent.pointerOver(region(), { pointerType: "mouse" });
    rerender(<TreeViewer graph={graph} debug={debug} onSelectNode={select} activeAscendancyId="A" />);
    expect(viewer().dataset.inspectedAscendancy).toBeUndefined();
    expect(document.querySelector(".ascendancy-inspection-hit[data-ascendancy-id='A']")).toBeNull();
    expect(node().classList.contains("active-ascendancy")).toBe(true);
    fireEvent.click(node());
    expect(select).toHaveBeenCalledWith("a2");
    fireEvent.click(node("Beta notable"));
    expect(select).toHaveBeenCalledTimes(1);
  });

  it("keeps added search overlays in sync during an inspection", () => {
    const graph = fixture();
    const props = { graph, debug, onSelectNode: vi.fn() };
    const { rerender } = render(<TreeViewer {...props} />);
    fireEvent.pointerOver(region(), { pointerType: "mouse" });
    rerender(<TreeViewer {...props} searchMatchNodeIds={new Set(["a2"])} />);
    expect(document.querySelector(".search-match-node")?.classList.contains("ascendancy-inspected")).toBe(true);
    expect(viewer().dataset.inspectedAscendancy).toBe("A");
  });
});
