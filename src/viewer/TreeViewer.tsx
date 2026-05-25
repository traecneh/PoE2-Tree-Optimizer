import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, PointerEvent, WheelEvent } from "react";
import { passiveIconPublicPath } from "../tree/passiveIconAssets";
import { treeEdgeKey } from "../tree/pathAllocation";
import type { TreeEdge, TreeGraph, TreeNode } from "../tree/types";
import type { DebugOverlayState } from "./DebugControls";
import { buildTreeEdgePath } from "./treeEdgePath";
import { buildFitViewBox } from "./treeViewBox";

type TreeViewerProps = {
  graph: TreeGraph;
  selectedNodeId?: string;
  nodeVisualScale?: number;
  searchMatchNodeIds?: ReadonlySet<string>;
  allocationPathNodeIds?: ReadonlySet<string>;
  allocationPathEdgeKeys?: ReadonlySet<string>;
  onSelectNode: (nodeId: string) => void;
  debug: DebugOverlayState;
};

type Point = {
  x: number;
  y: number;
};

type NodeGlyph = "class-start" | "keystone" | "notable" | "jewel-socket" | "attribute";

type NodeVisual = {
  coreRadius: number;
  frameRadius: number;
  haloRadius?: number;
  glyph?: NodeGlyph;
  accentClass: string;
  iconSize: number;
};

type ViewportTransform = {
  x: number;
  y: number;
  scale: number;
};

type TooltipState = {
  node: TreeNode;
  position: Point;
};

const initialViewportTransform: ViewportTransform = { x: 0, y: 0, scale: 1 };
const maxVisibleEdgeLength = 3000;
const maxViewportScale = 12;
const minViewportScale = 0.2;
const defaultNodeVisualScale = 2;

export function TreeViewer({
  graph,
  selectedNodeId,
  nodeVisualScale = defaultNodeVisualScale,
  searchMatchNodeIds,
  allocationPathNodeIds,
  allocationPathEdgeKeys,
  onSelectNode,
  debug,
}: TreeViewerProps) {
  const viewportRef = useRef<SVGGElement | null>(null);
  const viewportTransform = useRef<ViewportTransform>({ ...initialViewportTransform });
  const lastPointer = useRef<{ point: Point; startX: number; startY: number; dragged: boolean } | null>(null);
  const suppressNextNodeClick = useRef(false);
  const [tooltip, setTooltip] = useState<TooltipState | undefined>();
  const viewBox = buildFitViewBox(graph.bounds, 160);
  const connectedNodeIds = useMemo(() => new Set(graph.edges.flatMap((edge) => [edge.from, edge.to])), [graph.edges]);
  const renderedEdges = useMemo(
    () => graph.edges.flatMap((edge) => {
      const from = graph.nodes[edge.from];
      const to = graph.nodes[edge.to];
      if (!shouldDrawEdge(from, to)) return [];
      const group = from.groupId && from.groupId === to.groupId ? graph.groups[from.groupId] : undefined;
      const classNames = ["tree-edge"];
      const allocationPath = allocationPathEdgeKeys?.has(treeEdgeKey(edge.from, edge.to)) ?? false;
      if (debug.showEdgeRoutes) classNames.push("edge-route-debug", edgeRouteClass(edge));
      if (allocationPath) classNames.push("allocation-path");
      return [{
        id: `${edge.from}-${edge.to}`,
        path: buildTreeEdgePath(from, to, group, edge),
        routeOrbit: edge.connectionOrbit,
        className: classNames.join(" "),
        allocationPath,
        label: formatEdgeRouteLabel(edge.connectionOrbit),
        labelPosition: midpoint(from, to),
      }];
    }),
    [allocationPathEdgeKeys, debug.showEdgeRoutes, graph.edges, graph.groups, graph.nodes],
  );

  useEffect(() => {
    applyViewportTransform(viewportRef.current, viewportTransform.current);
  }, [graph]);

  function handleWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    const current = viewportTransform.current;
    setViewportTransform({
      ...current,
      scale: Math.min(maxViewportScale, Math.max(minViewportScale, current.scale * (event.deltaY > 0 ? 0.9 : 1.1))),
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

  function showTooltipAtPointer(node: TreeNode, event: MouseEvent<SVGGElement>) {
    setTooltip({ node, position: tooltipPositionFromClientPoint(event.clientX, event.clientY) });
  }

  function showTooltipAtElement(node: TreeNode, element: SVGGElement) {
    setTooltip({ node, position: tooltipPositionFromElement(element) });
  }

  function hideTooltip() {
    setTooltip(undefined);
  }

  return (
    <div className="tree-viewer">
      <button className="tool-button reset-view-button" type="button" onClick={resetViewportTransform}>
        Reset View
      </button>
      {tooltip ? <NodeTooltip node={tooltip.node} position={tooltip.position} /> : null}
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
            {renderedEdges.map((edge) => (
              <path
                key={edge.id}
                className={edge.className}
                d={edge.path}
                data-route-orbit={debug.showEdgeRoutes ? edge.routeOrbit : undefined}
              />
            ))}
          </g>
          <g className="path-highlight-layer" aria-hidden="true">
            {renderedEdges.flatMap((edge) => (
              edge.allocationPath ? [
                <path
                  key={`${edge.id}-path-highlight`}
                  className="allocation-path-edge"
                  d={edge.path}
                />,
              ] : []
            ))}
          </g>
          {debug.showEdgeRoutes && debug.showEdgeRouteLabels ? (
            <g className="edge-label-layer" aria-hidden="true">
              {renderedEdges.flatMap((edge) => (
                edge.label ? [
                  <text
                    key={edge.id}
                    className="edge-route-label"
                    x={edge.labelPosition.x}
                    y={edge.labelPosition.y - 8}
                  >
                    {edge.label}
                  </text>,
                ] : []
              ))}
            </g>
          ) : null}
          <g className="node-layer">
            {Object.values(graph.nodes).map((node) => (
              <ButtonNode
                key={node.id}
                node={node}
                selected={node.id === selectedNodeId}
                nodeVisualScale={nodeVisualScale}
                searchMatched={searchMatchNodeIds?.has(node.id) ?? false}
                allocationPath={allocationPathNodeIds?.has(node.id) ?? false}
                debug={debug}
                orphan={debug.highlightOrphans && !connectedNodeIds.has(node.id)}
                onShowTooltipAtPointer={showTooltipAtPointer}
                onShowTooltipAtElement={showTooltipAtElement}
                onHideTooltip={hideTooltip}
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
  if (edgeLength(from, to) > maxVisibleEdgeLength) return false;
  return !(from.flags.classStart && to.flags.classStart);
}

function edgeLength(from: TreeNode, to: TreeNode): number {
  return Math.hypot(to.position.x - from.position.x, to.position.y - from.position.y);
}

function midpoint(from: TreeNode, to: TreeNode): Point {
  return {
    x: (from.position.x + to.position.x) / 2,
    y: (from.position.y + to.position.y) / 2,
  };
}

function edgeRouteClass(edge: TreeEdge): string {
  const orbit = edge.connectionOrbit;
  if (orbit === undefined) return "edge-route-unknown";
  if (orbit === 0) return "edge-route-zero";
  if (orbit === 2147483647) return "edge-route-sentinel";
  return orbit > 0 ? "edge-route-positive" : "edge-route-negative";
}

function formatEdgeRouteLabel(connectionOrbit: number | undefined): string | undefined {
  if (connectionOrbit === undefined || connectionOrbit === 0) return undefined;
  if (connectionOrbit === 2147483647) return "max";
  return connectionOrbit > 0 ? `+${connectionOrbit}` : String(connectionOrbit);
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
  nodeVisualScale,
  searchMatched,
  allocationPath,
  debug,
  orphan,
  onShowTooltipAtPointer,
  onShowTooltipAtElement,
  onHideTooltip,
  onSelectNode,
}: {
  node: TreeNode;
  selected: boolean;
  nodeVisualScale: number;
  searchMatched: boolean;
  allocationPath: boolean;
  debug: DebugOverlayState;
  orphan: boolean;
  onShowTooltipAtPointer: (node: TreeNode, event: MouseEvent<SVGGElement>) => void;
  onShowTooltipAtElement: (node: TreeNode, element: SVGGElement) => void;
  onHideTooltip: () => void;
  onSelectNode: (nodeId: string) => void;
}) {
  const typeClass = nodeClass(node);
  const visual = nodeVisual(node, typeClass, nodeVisualScale);
  const radius = visual.coreRadius;
  const label = node.name ?? node.id;
  const iconPath = node.art?.icon
    ? passiveIconPublicPath(node.art.icon, node.art.assetKey)
    : undefined;
  const missingStats = debug.highlightMissingStats && node.stats.length === 0 && !node.flags.jewelSocket && !node.flags.classStart;
  const handleSelect = () => onSelectNode(node.id);
  const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onShowTooltipAtElement(node, event.currentTarget);
    handleSelect();
  };

  return (
    <g
      className={`tree-node ${typeClass} ${visual.accentClass}${selected ? " selected" : ""}${searchMatched ? " search-match" : ""}${allocationPath ? " allocation-path" : ""}${missingStats ? " missing-stats" : ""}${orphan ? " orphan-node" : ""}`}
      transform={`translate(${node.position.x} ${node.position.y})`}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={selected}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      onMouseEnter={(event) => onShowTooltipAtPointer(node, event)}
      onMouseLeave={onHideTooltip}
      onFocus={(event) => onShowTooltipAtElement(node, event.currentTarget)}
      onBlur={onHideTooltip}
    >
      <circle className="node-hit-target" r={visual.frameRadius + 16 * nodeVisualScale} />
      {orphan ? <circle className="debug-ring orphan-ring" r={radius + 14 * nodeVisualScale} /> : null}
      {missingStats ? <circle className="debug-ring missing-stats-ring" r={radius + 8 * nodeVisualScale} /> : null}
      {visual.haloRadius ? <circle className="node-halo" r={visual.haloRadius} /> : null}
      {selected ? <circle className="target-marker" r={visual.frameRadius + 34 * nodeVisualScale} /> : null}
      <circle className="node-frame" r={visual.frameRadius} />
      <circle className="node-core" r={radius}>
        <title>{label}</title>
      </circle>
      {iconPath ? (
        <image
          className="node-icon"
          href={iconPath}
          x={-visual.iconSize / 2}
          y={-visual.iconSize / 2}
          width={visual.iconSize}
          height={visual.iconSize}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        />
      ) : renderNodeGlyph(visual)}
      {debug.showNodeIds ? <text className="node-id-label" y={-radius - 8}>{node.id}</text> : null}
    </g>
  );
}

function NodeTooltip({ node, position }: { node: TreeNode; position: Point }) {
  const title = node.name ?? node.id;
  const stats = node.stats.length > 0 ? node.stats : [nodeTypeLabel(node)];

  return (
    <div
      className="node-tooltip"
      role="tooltip"
      style={{ left: position.x, top: position.y }}
    >
      <div className="node-tooltip-title">{title}</div>
      <div className="node-tooltip-stats">
        {stats.map((stat, index) => (
          <div key={`${stat}-${index}`}>{stat}</div>
        ))}
      </div>
      <div className="node-tooltip-state">Unallocated</div>
    </div>
  );
}

function tooltipPositionFromClientPoint(clientX: number, clientY: number): Point {
  return clampTooltipPosition({
    x: clientX + 18,
    y: clientY + 18,
  });
}

function tooltipPositionFromElement(element: SVGGElement): Point {
  const elementRect = element.getBoundingClientRect();

  return clampTooltipPosition({
    x: elementRect.right + 18,
    y: elementRect.top,
  });
}

function clampTooltipPosition(point: Point): Point {
  const viewportWidth = window.innerWidth || 1024;
  const viewportHeight = window.innerHeight || 768;
  const tooltipWidth = Math.min(520, viewportWidth - 24);
  const tooltipHeight = 210;
  const inset = 12;
  const maxX = Math.max(inset, viewportWidth - tooltipWidth - inset);
  const maxY = Math.max(inset, viewportHeight - tooltipHeight - inset);

  return {
    x: Math.min(Math.max(point.x, inset), maxX),
    y: Math.min(Math.max(point.y, inset), maxY),
  };
}

function nodeVisual(node: TreeNode, typeClass: string, nodeVisualScale: number): NodeVisual {
  const coreRadius = nodeRadius(node, nodeVisualScale);
  const frameInset = typeClass === "small" || typeClass === "attribute" ? 3 : 5;
  return {
    coreRadius,
    frameRadius: coreRadius + frameInset * nodeVisualScale,
    haloRadius: nodeHaloRadius(typeClass, coreRadius, nodeVisualScale),
    glyph: nodeGlyph(typeClass),
    accentClass: nodeAccentClass(node),
    iconSize: roundNodeVisualNumber(coreRadius * 1.6),
  };
}

function nodeRadius(node: TreeNode, nodeVisualScale: number): number {
  if (node.flags.classStart) return 26 * nodeVisualScale;
  if (node.flags.keystone) return 24 * nodeVisualScale;
  if (node.flags.notable) return 18 * nodeVisualScale;
  if (node.flags.jewelSocket) return 16 * nodeVisualScale;
  return 10 * nodeVisualScale;
}

function nodeClass(node: TreeNode): string {
  if (node.flags.classStart) return "class-start";
  if (node.flags.keystone) return "keystone";
  if (node.flags.notable) return "notable";
  if (node.flags.jewelSocket) return "jewel-socket";
  if (node.flags.attribute) return "attribute";
  return "small";
}

function nodeTypeLabel(node: TreeNode): string {
  if (node.flags.classStart) return "Class start";
  if (node.flags.keystone) return "Keystone";
  if (node.flags.notable) return "Notable";
  if (node.flags.jewelSocket) return "Jewel socket";
  if (node.flags.attribute) return "Attribute";
  return "Small passive";
}

function nodeHaloRadius(typeClass: string, coreRadius: number, nodeVisualScale: number): number | undefined {
  if (typeClass === "class-start") return coreRadius + 12 * nodeVisualScale;
  if (typeClass === "keystone") return coreRadius + 10 * nodeVisualScale;
  if (typeClass === "notable" || typeClass === "jewel-socket") return coreRadius + 7 * nodeVisualScale;
  return undefined;
}

function nodeGlyph(typeClass: string): NodeGlyph | undefined {
  if (
    typeClass === "class-start"
    || typeClass === "keystone"
    || typeClass === "notable"
    || typeClass === "jewel-socket"
    || typeClass === "attribute"
  ) {
    return typeClass;
  }
  return undefined;
}

function nodeAccentClass(node: TreeNode): string {
  const text = node.stats.join(" ").toLowerCase();
  if (text.includes("strength")) return "node-accent-strength";
  if (text.includes("dexterity")) return "node-accent-dexterity";
  if (text.includes("intelligence")) return "node-accent-intelligence";
  if (text.includes("critical")) return "node-accent-critical";
  if (text.includes("evasion")) return "node-accent-evasion";
  if (text.includes("energy shield")) return "node-accent-energy-shield";
  if (text.includes("armour")) return "node-accent-armour";
  if (text.includes("spell")) return "node-accent-spell";
  if (text.includes("minion")) return "node-accent-minion";
  if (text.includes("fire")) return "node-accent-fire";
  if (text.includes("cold")) return "node-accent-cold";
  if (text.includes("lightning")) return "node-accent-lightning";
  if (text.includes("chaos")) return "node-accent-chaos";
  return "node-accent-default";
}

function renderNodeGlyph(visual: NodeVisual) {
  if (!visual.glyph) return null;

  const r = Math.round(visual.coreRadius * 0.48);
  const inner = Math.round(r * 0.42);
  const outer = Math.round(r * 0.82);
  const className = `node-glyph ${visual.glyph}-glyph`;

  if (visual.glyph === "class-start") {
    return (
      <path
        className={className}
        d={`M 0 ${-r} L 0 ${r} M ${-r} 0 L ${r} 0 M ${-outer} ${-outer} L ${outer} ${outer} M ${-outer} ${outer} L ${outer} ${-outer}`}
        aria-hidden="true"
      />
    );
  }

  if (visual.glyph === "keystone") {
    return (
      <path
        className={className}
        d={`M 0 ${-r} L ${inner} ${-inner} L ${r} 0 L ${inner} ${inner} L 0 ${r} L ${-inner} ${inner} L ${-r} 0 L ${-inner} ${-inner} Z`}
        aria-hidden="true"
      />
    );
  }

  if (visual.glyph === "notable") {
    return (
      <path
        className={className}
        d={`M 0 ${-r} L ${r} 0 L 0 ${r} L ${-r} 0 Z`}
        aria-hidden="true"
      />
    );
  }

  if (visual.glyph === "jewel-socket") {
    return (
      <path
        className={className}
        d={`M 0 ${-r} L ${outer} ${-inner} L ${outer} ${inner} L 0 ${r} L ${-outer} ${inner} L ${-outer} ${-inner} Z`}
        aria-hidden="true"
      />
    );
  }

  return (
    <path
      className={className}
      d={`M ${-r} 0 L ${r} 0 M 0 ${-r} L 0 ${r}`}
      aria-hidden="true"
    />
  );
}

function roundNodeVisualNumber(value: number): number {
  return Math.round(value * 10) / 10;
}
