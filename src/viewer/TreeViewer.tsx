import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, WheelEvent } from "react";
import type { TreeGraph, TreeNode } from "../tree/types";
import { buildFitViewBox } from "./treeViewBox";

type TreeViewerProps = {
  graph: TreeGraph;
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
};

export function TreeViewer({ graph, selectedNodeId, onSelectNode }: TreeViewerProps) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const lastPointer = useRef<{ x: number; y: number; startX: number; startY: number; dragged: boolean } | null>(null);
  const suppressNextNodeClick = useRef(false);
  const viewBox = buildFitViewBox(graph.bounds, 160);

  function handleWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    setTransform((current) => ({
      ...current,
      scale: Math.min(4, Math.max(0.2, current.scale * (event.deltaY > 0 ? 0.9 : 1.1))),
    }));
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    lastPointer.current = { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, dragged: false };
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!lastPointer.current) return;
    const dx = event.clientX - lastPointer.current.x;
    const dy = event.clientY - lastPointer.current.y;
    const startDx = event.clientX - lastPointer.current.startX;
    const startDy = event.clientY - lastPointer.current.startY;
    const dragged = lastPointer.current.dragged || Math.hypot(startDx, startDy) > 4;
    const panScale = svgPanScale(event.currentTarget);

    lastPointer.current = {
      x: event.clientX,
      y: event.clientY,
      startX: lastPointer.current.startX,
      startY: lastPointer.current.startY,
      dragged,
    };
    if (dragged) suppressNextNodeClick.current = true;

    setTransform((current) => ({
      ...current,
      x: current.x + (dx * panScale.x) / current.scale,
      y: current.y + (dy * panScale.y) / current.scale,
    }));
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

  function handleSelectNode(nodeId: string) {
    if (suppressNextNodeClick.current) {
      suppressNextNodeClick.current = false;
      return;
    }
    onSelectNode(nodeId);
  }

  return (
    <div className="tree-viewer">
      <button className="tool-button reset-view-button" type="button" onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}>
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
        <g transform={`translate(${formatTransformNumber(transform.x)} ${formatTransformNumber(transform.y)}) scale(${formatTransformNumber(transform.scale)})`}>
          <g className="edge-layer">
            {graph.edges.map((edge) => {
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
                onSelectNode={handleSelectNode}
              />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}

function releasePointerCapture(svg: SVGSVGElement, pointerId: number) {
  if (svg.hasPointerCapture?.(pointerId) ?? true) {
    svg.releasePointerCapture?.(pointerId);
  }
}

function formatTransformNumber(value: number): string {
  return Number(value.toFixed(6)).toString();
}

function svgPanScale(svg: SVGSVGElement): { x: number; y: number } {
  const [, , width, height] = (svg.getAttribute("viewBox") ?? "0 0 1 1")
    .split(/\s+/)
    .map((value) => Number(value));

  return {
    x: width / Math.max(svg.clientWidth, 1),
    y: height / Math.max(svg.clientHeight, 1),
  };
}

function ButtonNode({ node, selected, onSelectNode }: { node: TreeNode; selected: boolean; onSelectNode: (nodeId: string) => void }) {
  const radius = nodeRadius(node);
  const label = node.name ?? node.id;
  const handleSelect = () => onSelectNode(node.id);
  const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleSelect();
  };

  return (
    <g
      className={`tree-node ${nodeClass(node)}${selected ? " selected" : ""}`}
      transform={`translate(${node.position.x} ${node.position.y})`}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={selected}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
    >
      <circle r={radius}>
        <title>{label}</title>
      </circle>
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
