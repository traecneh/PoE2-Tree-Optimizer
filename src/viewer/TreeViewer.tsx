import { useEffect, useMemo, useRef } from "react";
import type { KeyboardEvent, PointerEvent, WheelEvent } from "react";
import type { TreeGraph, TreeNode } from "../tree/types";
import type { DebugOverlayState } from "./DebugControls";
import { buildFitViewBox } from "./treeViewBox";

type TreeViewerProps = {
  graph: TreeGraph;
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
  debug: DebugOverlayState;
};

type Point = {
  x: number;
  y: number;
};

type ViewportTransform = {
  x: number;
  y: number;
  scale: number;
};

const initialViewportTransform: ViewportTransform = { x: 0, y: 0, scale: 1 };

export function TreeViewer({ graph, selectedNodeId, onSelectNode, debug }: TreeViewerProps) {
  const viewportRef = useRef<SVGGElement | null>(null);
  const viewportTransform = useRef<ViewportTransform>({ ...initialViewportTransform });
  const lastPointer = useRef<{ point: Point; startX: number; startY: number; dragged: boolean } | null>(null);
  const suppressNextNodeClick = useRef(false);
  const viewBox = buildFitViewBox(graph.bounds, 160);
  const connectedNodeIds = useMemo(() => new Set(graph.edges.flatMap((edge) => [edge.from, edge.to])), [graph.edges]);
  const renderedEdges = useMemo(
    () => graph.edges.filter((edge) => shouldDrawEdge(graph.nodes[edge.from], graph.nodes[edge.to])),
    [graph.edges, graph.nodes],
  );

  useEffect(() => {
    applyViewportTransform(viewportRef.current, viewportTransform.current);
  }, [graph]);

  function handleWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    const current = viewportTransform.current;
    setViewportTransform({
      ...current,
      scale: Math.min(4, Math.max(0.2, current.scale * (event.deltaY > 0 ? 0.9 : 1.1))),
    });
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    lastPointer.current = {
      point: clientPointToSvg(event.currentTarget, event.clientX, event.clientY),
      startX: event.clientX,
      startY: event.clientY,
      dragged: false,
    };
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!lastPointer.current) return;
    const startDx = event.clientX - lastPointer.current.startX;
    const startDy = event.clientY - lastPointer.current.startY;
    const dragged = lastPointer.current.dragged || Math.hypot(startDx, startDy) > 4;
    const point = clientPointToSvg(event.currentTarget, event.clientX, event.clientY);
    const dx = point.x - lastPointer.current.point.x;
    const dy = point.y - lastPointer.current.point.y;

    lastPointer.current = {
      point,
      startX: lastPointer.current.startX,
      startY: lastPointer.current.startY,
      dragged,
    };
    if (dragged) suppressNextNodeClick.current = true;

    if (!dragged) return;

    const current = viewportTransform.current;
    setViewportTransform({
      ...current,
      x: current.x + dx / current.scale,
      y: current.y + dy / current.scale,
    });
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    const dragged = lastPointer.current?.dragged;
    releasePointerCapture(event.currentTarget, event.pointerId);
    lastPointer.current = null;
    if (dragged) {
      window.setTimeout(() => {
        suppressNextNodeClick.current = false;
      }, 0);
    }
  }

  function handlePointerCancel(event: PointerEvent<SVGSVGElement>) {
    releasePointerCapture(event.currentTarget, event.pointerId);
    lastPointer.current = null;
  }

  function setViewportTransform(nextTransform: ViewportTransform) {
    viewportTransform.current = nextTransform;
    applyViewportTransform(viewportRef.current, nextTransform);
  }

  function resetViewportTransform() {
    setViewportTransform({ ...initialViewportTransform });
  }

  function handleSelectNode(nodeId: string) {
    if (suppressNextNodeClick.current) {
      suppressNextNodeClick.current = false;
      return;
    }
    onSelectNode(nodeId);
  }

  return (
    <div className="tree-viewer">
      <button className="tool-button reset-view-button" type="button" onClick={resetViewportTransform}>
        Reset View
      </button>
      <svg
        className="tree-svg"
        viewBox={viewBox}
        role="img"
        aria-label="PoE2 passive skill tree"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <g ref={viewportRef} transform={formatViewportTransform(viewportTransform.current)}>
          <g className="edge-layer">
            {renderedEdges.map((edge) => {
              const from = graph.nodes[edge.from];
              const to = graph.nodes[edge.to];
              if (!from || !to) return null;
              return (
                <line
                  key={`${edge.from}-${edge.to}`}
                  className="tree-edge"
                  x1={from.position.x}
                  y1={from.position.y}
                  x2={to.position.x}
                  y2={to.position.y}
                />
              );
            })}
          </g>
          <g className="node-layer">
            {Object.values(graph.nodes).map((node) => (
              <ButtonNode
                key={node.id}
                node={node}
                selected={node.id === selectedNodeId}
                debug={debug}
                orphan={debug.highlightOrphans && !connectedNodeIds.has(node.id)}
                onSelectNode={handleSelectNode}
              />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}

function shouldDrawEdge(from: TreeNode | undefined, to: TreeNode | undefined): boolean {
  if (!from || !to) return false;
  return !(from.flags.classStart && to.flags.classStart);
}

function applyViewportTransform(layer: SVGGElement | null, transform: ViewportTransform) {
  layer?.setAttribute("transform", formatViewportTransform(transform));
}

function formatViewportTransform(transform: ViewportTransform): string {
  return `translate(${formatTransformNumber(transform.x)} ${formatTransformNumber(transform.y)}) scale(${formatTransformNumber(transform.scale)})`;
}

function releasePointerCapture(svg: SVGSVGElement, pointerId: number) {
  if (svg.hasPointerCapture?.(pointerId) ?? true) {
    svg.releasePointerCapture?.(pointerId);
  }
}

function formatTransformNumber(value: number): string {
  return Number(value.toFixed(6)).toString();
}

function clientPointToSvg(svg: SVGSVGElement, clientX: number, clientY: number): Point {
  const point = svg.createSVGPoint?.();
  const screenMatrix = svg.getScreenCTM?.();
  if (!point || !screenMatrix) return { x: clientX, y: clientY };

  point.x = clientX;
  point.y = clientY;
  const svgPoint = point.matrixTransform(screenMatrix.inverse());
  return { x: svgPoint.x, y: svgPoint.y };
}

function ButtonNode({
  node,
  selected,
  debug,
  orphan,
  onSelectNode,
}: {
  node: TreeNode;
  selected: boolean;
  debug: DebugOverlayState;
  orphan: boolean;
  onSelectNode: (nodeId: string) => void;
}) {
  const radius = nodeRadius(node);
  const label = node.name ?? node.id;
  const missingStats = debug.highlightMissingStats && node.stats.length === 0 && !node.flags.jewelSocket && !node.flags.classStart;
  const handleSelect = () => onSelectNode(node.id);
  const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleSelect();
  };

  return (
    <g
      className={`tree-node ${nodeClass(node)}${selected ? " selected" : ""}${missingStats ? " missing-stats" : ""}${orphan ? " orphan-node" : ""}`}
      transform={`translate(${node.position.x} ${node.position.y})`}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={selected}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
    >
      {orphan ? <circle className="debug-ring orphan-ring" r={radius + 14} /> : null}
      {missingStats ? <circle className="debug-ring missing-stats-ring" r={radius + 8} /> : null}
      <circle className="node-core" r={radius}>
        <title>{label}</title>
      </circle>
      {debug.showNodeIds ? <text className="node-id-label" y={-radius - 8}>{node.id}</text> : null}
    </g>
  );
}

function nodeRadius(node: TreeNode): number {
  if (node.flags.classStart) return 26;
  if (node.flags.keystone) return 24;
  if (node.flags.notable) return 18;
  if (node.flags.jewelSocket) return 16;
  return 10;
}

function nodeClass(node: TreeNode): string {
  if (node.flags.classStart) return "class-start";
  if (node.flags.keystone) return "keystone";
  if (node.flags.notable) return "notable";
  if (node.flags.jewelSocket) return "jewel-socket";
  if (node.flags.attribute) return "attribute";
  return "small";
}
