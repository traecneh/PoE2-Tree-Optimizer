import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import type { FocusEvent, KeyboardEvent, MouseEvent, PointerEvent, RefObject, WheelEvent } from "react";
import { passiveIconPublicPath } from "../tree/passiveIconAssets";
import { treeEdgeKey } from "../tree/pathAllocation";
import type { TreeEdge, TreeGraph, TreeNode } from "../tree/types";
import { buildTreeEdgePath } from "./treeEdgePath";
import { buildFitViewBox } from "./treeViewBox";

export type DebugOverlayState = {
  showNodeIds: boolean;
  highlightMissingStats: boolean;
  highlightOrphans: boolean;
  showEdgeRoutes: boolean;
  showEdgeRouteLabels: boolean;
};

type TreeViewerProps = {
  graph: TreeGraph;
  selectedNodeId?: string;
  pathStartNodeId?: string;
  pathStartClassName?: string;
  activeAscendancyId?: string;
  noAllocationPathNodeId?: string;
  nodeVisualScale?: number;
  searchMatchNodeIds?: ReadonlySet<string>;
  searchFocusedNodeId?: string;
  buildGoalNodeIds?: ReadonlySet<string>;
  allocatedNodeIds?: ReadonlySet<string>;
  allocatedEdgeKeys?: ReadonlySet<string>;
  allocationPathNodeIds?: ReadonlySet<string>;
  allocationPathEdgeKeys?: ReadonlySet<string>;
  hoverAllocationPathNodeIds?: ReadonlySet<string>;
  hoverAllocationPathEdgeKeys?: ReadonlySet<string>;
  onSelectNode: (nodeId: string) => void;
  onAddBuildGoal?: (nodeId: string) => void;
  onHoverNode?: (nodeId: string | undefined) => void;
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

type RenderedTreeEdge = {
  id: string;
  key: string;
  path: string;
  routeOrbit: number | undefined;
  routeClass: string;
  ascendancyClass?: string;
  label: string | undefined;
  labelPosition: Point;
};

type RenderedTreeNode = {
  node: TreeNode;
  typeClass: string;
  visual: NodeVisual;
  label: string;
  iconPath: string | undefined;
};

type TreeLayoutProjection = {
  nodes: Record<string, TreeNode>;
  groups: TreeGraph["groups"];
};

type ViewportTransform = {
  x: number;
  y: number;
  scale: number;
};

type PendingNodePress = {
  nodeId: string;
  action: "select" | "add-build-goal";
};

const initialViewportTransform: ViewportTransform = { x: 0, y: 0, scale: 1 };
const maxVisibleEdgeLength = 3000;
const maxViewportScale = 18;
const minViewportScale = 0.2;
const viewportZoomStep = 1.1;
const defaultNodeVisualScale = 2;
const viewportMovingIdleMs = 180;
const nodeIconSizeMultiplier = 2.2;
const nodeIconClipPathId = "tree-node-icon-clip";
const nodeIconClipRadius = "0.454545";

export function TreeViewer({
  graph,
  selectedNodeId,
  pathStartNodeId,
  pathStartClassName,
  activeAscendancyId,
  noAllocationPathNodeId,
  nodeVisualScale = defaultNodeVisualScale,
  searchMatchNodeIds,
  searchFocusedNodeId,
  buildGoalNodeIds,
  allocatedNodeIds,
  allocatedEdgeKeys,
  allocationPathNodeIds,
  allocationPathEdgeKeys,
  hoverAllocationPathNodeIds,
  hoverAllocationPathEdgeKeys,
  onSelectNode,
  onAddBuildGoal,
  onHoverNode,
  debug,
}: TreeViewerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const viewportRef = useRef<SVGGElement | null>(null);
  const viewportTransform = useRef<ViewportTransform>({ ...initialViewportTransform });
  const viewportMovingTimer = useRef<number | undefined>(undefined);
  const lastPointer = useRef<{ point: Point; startX: number; startY: number; dragged: boolean } | null>(null);
  const pendingNodePress = useRef<PendingNodePress | null>(null);
  const suppressNextNodeClick = useRef(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipTitleRef = useRef<HTMLDivElement | null>(null);
  const tooltipStatsRef = useRef<HTMLDivElement | null>(null);
  const onSelectNodeRef = useRef(onSelectNode);
  const onAddBuildGoalRef = useRef(onAddBuildGoal);
  const onHoverNodeRef = useRef(onHoverNode);
  const viewBox = buildFitViewBox(graph.bounds, 160);
  const layoutProjection = useMemo(
    () => projectActiveAscendancyLayout(graph, activeAscendancyId),
    [activeAscendancyId, graph],
  );

  useEffect(() => {
    onSelectNodeRef.current = onSelectNode;
  }, [onSelectNode]);

  useEffect(() => {
    onAddBuildGoalRef.current = onAddBuildGoal;
  }, [onAddBuildGoal]);

  useEffect(() => {
    onHoverNodeRef.current = onHoverNode;
  }, [onHoverNode]);
  const connectedNodeIds = useMemo(() => new Set(graph.edges.flatMap((edge) => [edge.from, edge.to])), [graph.edges]);
  const renderedEdges = useMemo(
    () => graph.edges.flatMap((edge) => {
      const originalFrom = graph.nodes[edge.from];
      const originalTo = graph.nodes[edge.to];
      if (!shouldDrawEdge(originalFrom, originalTo)) return [];

      const from = layoutProjection.nodes[edge.from];
      const to = layoutProjection.nodes[edge.to];
      if (!from || !to) return [];
      const group = from.groupId && from.groupId === to.groupId ? layoutProjection.groups[from.groupId] : undefined;
      return [{
        id: `${edge.from}-${edge.to}`,
        key: treeEdgeKey(edge.from, edge.to),
        path: buildTreeEdgePath(from, to, group, edge),
        routeOrbit: edge.connectionOrbit,
        routeClass: edgeRouteClass(edge),
        ascendancyClass: edgeAscendancyClass(originalFrom, originalTo, activeAscendancyId),
        label: formatEdgeRouteLabel(edge.connectionOrbit),
        labelPosition: midpoint(from, to),
      }];
    }),
    [activeAscendancyId, graph.edges, graph.nodes, layoutProjection.groups, layoutProjection.nodes],
  );
  const renderedEdgeByKey = useMemo(
    () => new Map(renderedEdges.map((edge) => [edge.key, edge])),
    [renderedEdges],
  );
  const allocatedHighlightEdges = useMemo(
    () => renderedEdgesForKeys(allocatedEdgeKeys, renderedEdgeByKey),
    [allocatedEdgeKeys, renderedEdgeByKey],
  );
  const allocationPathHighlightEdges = useMemo(
    () => renderedEdgesForKeys(allocationPathEdgeKeys, renderedEdgeByKey),
    [allocationPathEdgeKeys, renderedEdgeByKey],
  );
  const hoverAllocationPathHighlightEdges = useMemo(
    () => renderedEdgesForKeys(hoverAllocationPathEdgeKeys, renderedEdgeByKey),
    [hoverAllocationPathEdgeKeys, renderedEdgeByKey],
  );
  const renderedNodes = useMemo(
    () => Object.values(layoutProjection.nodes).map((node) => renderedNode(
      node,
      nodeVisualScale,
      node.id === pathStartNodeId ? pathStartClassName : undefined,
    )),
    [layoutProjection.nodes, nodeVisualScale, pathStartClassName, pathStartNodeId],
  );
  const renderedNodeById = useMemo(
    () => new Map(renderedNodes.map((node) => [node.node.id, node])),
    [renderedNodes],
  );
  const searchMatchNodes = useMemo(
    () => renderedNodesForIds(searchMatchNodeIds, renderedNodeById),
    [renderedNodeById, searchMatchNodeIds],
  );
  const searchFocusedNode = searchFocusedNodeId ? renderedNodeById.get(searchFocusedNodeId) : undefined;

  useEffect(() => {
    applyViewportTransform(viewportRef.current, viewportTransform.current);
  }, [graph]);

  useEffect(() => () => {
    if (viewportMovingTimer.current !== undefined) {
      window.clearTimeout(viewportMovingTimer.current);
    }
  }, []);

  function handleWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    const pointer = clientPointToSvg(event.currentTarget, event.clientX, event.clientY);
    zoomViewport(event.deltaY > 0 ? 1 / viewportZoomStep : viewportZoomStep, pointer);
  }

  function zoomViewport(scaleFactor: number, pivot: Point) {
    const current = viewportTransform.current;
    const scale = clampViewportScale(current.scale * scaleFactor);
    const scaleRatio = scale / current.scale;

    setViewportTransform({
      x: pivot.x - (pivot.x - current.x) * scaleRatio,
      y: pivot.y - (pivot.y - current.y) * scaleRatio,
      scale,
    });
  }

  function zoomViewportAtCenter(scaleFactor: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const center = clientPointToSvg(svg, rect.left + rect.width / 2, rect.top + rect.height / 2);
    zoomViewport(scaleFactor, center);
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
      x: current.x + dx,
      y: current.y + dy,
    });
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    const dragged = lastPointer.current?.dragged;
    const pendingPress = pendingNodePress.current;
    releasePointerCapture(event.currentTarget, event.pointerId);
    lastPointer.current = null;
    pendingNodePress.current = null;
    if (dragged) {
      window.setTimeout(() => {
        suppressNextNodeClick.current = false;
      }, 0);
      return;
    }
    if (pendingPress) {
      suppressNextNodeClick.current = true;
      if (pendingPress.action === "add-build-goal") {
        onAddBuildGoalRef.current?.(pendingPress.nodeId);
      } else {
        onSelectNodeRef.current(pendingPress.nodeId);
      }
      window.setTimeout(() => {
        suppressNextNodeClick.current = false;
      }, 0);
    }
  }

  function handlePointerCancel(event: PointerEvent<SVGSVGElement>) {
    releasePointerCapture(event.currentTarget, event.pointerId);
    lastPointer.current = null;
    pendingNodePress.current = null;
  }

  function setViewportTransform(nextTransform: ViewportTransform) {
    viewportTransform.current = nextTransform;
    applyViewportTransform(viewportRef.current, nextTransform);
    markViewportMoving();
  }

  function resetViewportTransform() {
    setViewportTransform({ ...initialViewportTransform });
  }

  function markViewportMoving() {
    rootRef.current?.classList.add("viewport-moving");
    if (viewportMovingTimer.current !== undefined) {
      window.clearTimeout(viewportMovingTimer.current);
    }
    viewportMovingTimer.current = window.setTimeout(() => {
      rootRef.current?.classList.remove("viewport-moving");
      viewportMovingTimer.current = undefined;
    }, viewportMovingIdleMs);
  }

  const handleSelectNode = useCallback((nodeId: string) => {
    if (suppressNextNodeClick.current) {
      suppressNextNodeClick.current = false;
      return;
    }
    onSelectNodeRef.current(nodeId);
  }, []);

  const handleBeginNodePress = useCallback((nodeId: string, event: PointerEvent<SVGGElement>) => {
    if (event.button !== 0) return;

    pendingNodePress.current = {
      nodeId,
      action: event.ctrlKey && onAddBuildGoalRef.current ? "add-build-goal" : "select",
    };
  }, []);

  const showTooltip = useCallback((node: TreeNode, position: Point) => {
    const tooltip = tooltipRef.current;
    const titleElement = tooltipTitleRef.current;
    const statsElement = tooltipStatsRef.current;
    if (!tooltip || !titleElement || !statsElement) return;

    titleElement.textContent = node.name ?? node.id;
    statsElement.replaceChildren(...tooltipStatElements(node));
    tooltip.style.left = `${position.x}px`;
    tooltip.style.top = `${position.y}px`;
    tooltip.hidden = false;
  }, []);

  const showTooltipAtPointer = useCallback((node: TreeNode, event: MouseEvent<SVGGElement> | PointerEvent<SVGGElement>) => {
    showTooltip(node, tooltipPositionFromClientPoint(event.clientX, event.clientY));
  }, [showTooltip]);

  const showTooltipAtElement = useCallback((node: TreeNode, element: SVGGElement) => {
    showTooltip(node, tooltipPositionFromElement(element));
  }, [showTooltip]);

  const hideTooltip = useCallback(() => {
    if (tooltipRef.current) {
      tooltipRef.current.hidden = true;
    }
  }, []);

  const handleHoverNode = useCallback((nodeId: string | undefined) => {
    onHoverNodeRef.current?.(nodeId);
  }, []);

  return (
    <div ref={rootRef} className={`tree-viewer${activeAscendancyId ? " has-active-ascendancy" : ""}`}>
      <div className="viewport-toolbar" role="toolbar" aria-label="Tree viewport controls">
        <button
          className="tool-button viewport-button"
          type="button"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => zoomViewportAtCenter(1 / viewportZoomStep)}
        >
          -
        </button>
        <button
          className="tool-button viewport-button"
          type="button"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => zoomViewportAtCenter(viewportZoomStep)}
        >
          +
        </button>
        <button
          className="tool-button viewport-button"
          type="button"
          aria-label="Fit tree"
          title="Fit tree"
          onClick={resetViewportTransform}
        >
          <svg className="viewport-button-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M 8 4 H 4 V 8 M 16 4 H 20 V 8 M 20 16 V 20 H 16 M 8 20 H 4 V 16" />
          </svg>
        </button>
      </div>
      <NodeTooltipShell
        tooltipRef={tooltipRef}
        titleRef={tooltipTitleRef}
        statsRef={tooltipStatsRef}
      />
      <svg
        ref={svgRef}
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
        <defs>
          <clipPath id={nodeIconClipPathId} className="node-icon-clip" clipPathUnits="objectBoundingBox">
            <circle cx="0.5" cy="0.5" r={nodeIconClipRadius} />
          </clipPath>
        </defs>
        <g ref={viewportRef} transform={formatViewportTransform(viewportTransform.current)}>
          <g className="edge-layer">
            {renderedEdges.map((edge) => (
              <path
                key={edge.id}
                className={edgeClassName(edge, allocatedEdgeKeys, allocationPathEdgeKeys, hoverAllocationPathEdgeKeys, debug)}
                d={edge.path}
                data-route-orbit={debug.showEdgeRoutes ? edge.routeOrbit : undefined}
              />
            ))}
          </g>
          <g className="allocated-highlight-layer" aria-hidden="true">
            {allocatedHighlightEdges.map((edge) => (
              <path
                key={`${edge.id}-allocated-highlight`}
                className="allocated-edge"
                d={edge.path}
              />
            ))}
          </g>
          <g className="path-highlight-layer" aria-hidden="true">
            {allocationPathHighlightEdges.map((edge) => (
              <path
                key={`${edge.id}-path-highlight`}
                className="allocation-path-edge"
                d={edge.path}
              />
            ))}
          </g>
          <g className="hover-path-highlight-layer" aria-hidden="true">
            {hoverAllocationPathHighlightEdges.map((edge) => (
              <path
                key={`${edge.id}-hover-path-highlight`}
                className="hover-allocation-path-edge"
                d={edge.path}
              />
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
          <g className="search-highlight-layer" aria-hidden="true">
            {searchMatchNodes.map((node) => (
              <SearchMatchMarker key={`${node.node.id}-search-match`} renderedNode={node} nodeVisualScale={nodeVisualScale} />
            ))}
          </g>
          <g className="search-focus-highlight-layer" aria-hidden="true">
            {searchFocusedNode ? (
              <SearchFocusMarker renderedNode={searchFocusedNode} nodeVisualScale={nodeVisualScale} />
            ) : null}
          </g>
          <g className="node-layer">
            {renderedNodes.map((node) => (
              <ButtonNode
                key={node.node.id}
                renderedNode={node}
                selected={node.node.id === selectedNodeId}
                pathStart={node.node.id === pathStartNodeId}
                ascendancyClass={nodeAscendancyClass(node.node, activeAscendancyId)}
                noAllocationPath={node.node.id === noAllocationPathNodeId}
                nodeVisualScale={nodeVisualScale}
                buildGoal={buildGoalNodeIds?.has(node.node.id) ?? false}
                allocated={allocatedNodeIds?.has(node.node.id) ?? false}
                allocationPath={allocationPathNodeIds?.has(node.node.id) ?? false}
                hoverAllocationPath={hoverAllocationPathNodeIds?.has(node.node.id) ?? false}
                debug={debug}
                orphan={debug.highlightOrphans && !connectedNodeIds.has(node.node.id)}
                onShowTooltipAtPointer={showTooltipAtPointer}
                onShowTooltipAtElement={showTooltipAtElement}
                onHideTooltip={hideTooltip}
                onHoverNode={handleHoverNode}
                onBeginNodePress={handleBeginNodePress}
                onSelectNode={handleSelectNode}
              />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}

function projectActiveAscendancyLayout(
  graph: TreeGraph,
  activeAscendancyId: string | undefined,
): TreeLayoutProjection {
  if (!activeAscendancyId) {
    return { nodes: graph.nodes, groups: graph.groups };
  }

  const activeNodes = Object.values(graph.nodes).filter((node) => isActiveAscendancyLayoutNode(node, activeAscendancyId));
  if (activeNodes.length === 0) {
    return { nodes: graph.nodes, groups: graph.groups };
  }

  const activeCenter = centerOfPoints(activeNodes.map((node) => node.position));
  const mainCenter = mainTreeCenter(graph);
  const dx = mainCenter.x - activeCenter.x;
  const dy = mainCenter.y - activeCenter.y;
  if (dx === 0 && dy === 0) {
    return { nodes: graph.nodes, groups: graph.groups };
  }

  const activeNodeIds = new Set(activeNodes.map((node) => node.id));
  const nodes = { ...graph.nodes };
  for (const node of activeNodes) {
    nodes[node.id] = {
      ...node,
      position: translatePoint(node.position, dx, dy),
    };
  }

  const groups = { ...graph.groups };
  for (const group of Object.values(graph.groups)) {
    if (!group.position || !group.nodeIds.some((nodeId) => activeNodeIds.has(nodeId))) continue;
    groups[group.id] = {
      ...group,
      position: translatePoint(group.position, dx, dy),
    };
  }

  return { nodes, groups };
}

function isActiveAscendancyLayoutNode(node: TreeNode, activeAscendancyId: string): boolean {
  return Boolean(node.flags.ascendancy && node.ascendancy?.id === activeAscendancyId);
}

function mainTreeCenter(graph: TreeGraph): Point {
  const mainClassStartNodes = Object.values(graph.classStarts)
    .map((nodeId) => graph.nodes[nodeId])
    .filter((node): node is TreeNode => Boolean(node && node.flags.classStart && !node.flags.ascendancy));
  if (mainClassStartNodes.length >= 3) {
    return averagePoint(mainClassStartNodes.map((node) => node.position));
  }

  const mainTreeNodes = Object.values(graph.nodes).filter((node) => !node.flags.ascendancy);
  if (mainTreeNodes.length > 0) {
    return centerOfPoints(mainTreeNodes.map((node) => node.position));
  }

  return {
    x: (graph.bounds.minX + graph.bounds.maxX) / 2,
    y: (graph.bounds.minY + graph.bounds.maxY) / 2,
  };
}

function centerOfPoints(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };

  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  for (const point of points.slice(1)) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  };
}

function averagePoint(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };

  const total = points.reduce(
    (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }),
    { x: 0, y: 0 },
  );
  return {
    x: total.x / points.length,
    y: total.y / points.length,
  };
}

function translatePoint(point: Point, dx: number, dy: number): Point {
  return {
    x: roundLayoutNumber(point.x + dx),
    y: roundLayoutNumber(point.y + dy),
  };
}

function roundLayoutNumber(value: number): number {
  return Number(value.toFixed(6));
}

function renderedNode(node: TreeNode, nodeVisualScale: number, classStartNameOverride?: string): RenderedTreeNode {
  const typeClass = nodeClass(node);
  const art = classStartIconArt(node, classStartNameOverride) ?? node.art;
  return {
    node,
    typeClass,
    visual: nodeVisual(node, typeClass, nodeVisualScale),
    label: node.name ?? node.id,
    iconPath: art?.icon
      ? passiveIconPublicPath(art.icon, art.assetKey)
      : undefined,
  };
}

const classStartIconArtByName: Record<string, NonNullable<TreeNode["art"]>> = {
  DUELIST: {
    icon: "Art/2DArt/SkillIcons/ExplosiveGrenade.dds",
    assetKey: "art-2dart-skillicons-explosivegrenade",
  },
  MERCENARY: {
    icon: "Art/2DArt/SkillIcons/ExplosiveGrenade.dds",
    assetKey: "art-2dart-skillicons-explosivegrenade",
  },
  MARAUDER: {
    icon: "Art/2DArt/SkillIcons/passives/Warrior.dds",
    assetKey: "art-2dart-skillicons-passives-warrior",
  },
  WARRIOR: {
    icon: "Art/2DArt/SkillIcons/passives/Warrior.dds",
    assetKey: "art-2dart-skillicons-passives-warrior",
  },
  RANGER: {
    icon: "Art/2DArt/SkillIcons/passives/Hunter.dds",
    assetKey: "art-2dart-skillicons-passives-hunter",
  },
  HUNTRESS: {
    icon: "Art/2DArt/SkillIcons/passives/Hunter.dds",
    assetKey: "art-2dart-skillicons-passives-hunter",
  },
  TEMPLAR: {
    icon: "Art/2DArt/SkillIcons/passives/DruidGenericShapeshiftNode.dds",
    assetKey: "art-2dart-skillicons-passives-druidgenericshapeshiftnode",
  },
  DRUID: {
    icon: "Art/2DArt/SkillIcons/passives/DruidGenericShapeshiftNode.dds",
    assetKey: "art-2dart-skillicons-passives-druidgenericshapeshiftnode",
  },
  WITCH: {
    icon: "Art/2DArt/SkillIcons/WitchBoneStorm.dds",
    assetKey: "art-2dart-skillicons-witchbonestorm",
  },
  SORCERESS: {
    icon: "Art/2DArt/SkillIcons/passives/SorceressInvocationSpellsKeystone.dds",
    assetKey: "art-2dart-skillicons-passives-sorceressinvocationspellskeystone",
  },
  SIX: {
    icon: "Art/2DArt/SkillIcons/passives/MonkElementalChakra.dds",
    assetKey: "art-2dart-skillicons-passives-monkelementalchakra",
  },
  MONK: {
    icon: "Art/2DArt/SkillIcons/passives/MonkElementalChakra.dds",
    assetKey: "art-2dart-skillicons-passives-monkelementalchakra",
  },
};

function classStartIconArt(node: TreeNode, classNameOverride?: string): TreeNode["art"] | undefined {
  if (!node.flags.classStart || node.flags.ascendancy) return undefined;
  const className = (classNameOverride ?? node.name)?.trim().toUpperCase();
  return className ? classStartIconArtByName[className] : undefined;
}

function renderedNodesForIds(
  nodeIds: ReadonlySet<string> | undefined,
  renderedNodeById: ReadonlyMap<string, RenderedTreeNode>,
): RenderedTreeNode[] {
  if (!nodeIds || nodeIds.size === 0) return [];
  const nodes: RenderedTreeNode[] = [];
  for (const nodeId of nodeIds) {
    const node = renderedNodeById.get(nodeId);
    if (node) nodes.push(node);
  }
  return nodes;
}

function renderedEdgesForKeys(
  edgeKeys: ReadonlySet<string> | undefined,
  renderedEdgeByKey: ReadonlyMap<string, RenderedTreeEdge>,
): RenderedTreeEdge[] {
  if (!edgeKeys || edgeKeys.size === 0) return [];
  const edges: RenderedTreeEdge[] = [];
  for (const edgeKey of edgeKeys) {
    const edge = renderedEdgeByKey.get(edgeKey);
    if (edge) edges.push(edge);
  }
  return edges;
}

function edgeClassName(
  edge: RenderedTreeEdge,
  allocatedEdgeKeys: ReadonlySet<string> | undefined,
  allocationPathEdgeKeys: ReadonlySet<string> | undefined,
  hoverAllocationPathEdgeKeys: ReadonlySet<string> | undefined,
  debug: DebugOverlayState,
): string {
  const classNames = ["tree-edge"];
  if (allocatedEdgeKeys?.has(edge.key)) classNames.push("allocated");
  if (debug.showEdgeRoutes) classNames.push("edge-route-debug", edge.routeClass);
  if (edge.ascendancyClass) classNames.push(edge.ascendancyClass);
  if (allocationPathEdgeKeys?.has(edge.key)) classNames.push("allocation-path");
  if (hoverAllocationPathEdgeKeys?.has(edge.key)) classNames.push("hover-allocation-path");
  return classNames.join(" ");
}

function nodeAscendancyClass(node: TreeNode, activeAscendancyId: string | undefined): string | undefined {
  if (!activeAscendancyId || !node.flags.ascendancy) return undefined;
  return node.ascendancy?.id === activeAscendancyId ? "active-ascendancy" : "inactive-ascendancy";
}

function edgeAscendancyClass(
  from: TreeNode,
  to: TreeNode,
  activeAscendancyId: string | undefined,
): string | undefined {
  if (!activeAscendancyId || !from.flags.ascendancy || !to.flags.ascendancy) return undefined;
  const fromAscendancyId = from.ascendancy?.id;
  const toAscendancyId = to.ascendancy?.id;
  if (!fromAscendancyId || fromAscendancyId !== toAscendancyId) return undefined;
  return fromAscendancyId === activeAscendancyId ? "active-ascendancy-edge" : "inactive-ascendancy-edge";
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

function clampViewportScale(scale: number): number {
  return Math.min(maxViewportScale, Math.max(minViewportScale, scale));
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

type ButtonNodeProps = {
  renderedNode: RenderedTreeNode;
  selected: boolean;
  pathStart: boolean;
  ascendancyClass?: string;
  noAllocationPath: boolean;
  nodeVisualScale: number;
  buildGoal: boolean;
  allocated: boolean;
  allocationPath: boolean;
  hoverAllocationPath: boolean;
  debug: DebugOverlayState;
  orphan: boolean;
  onShowTooltipAtPointer: (node: TreeNode, event: MouseEvent<SVGGElement> | PointerEvent<SVGGElement>) => void;
  onShowTooltipAtElement: (node: TreeNode, element: SVGGElement) => void;
  onHideTooltip: () => void;
  onHoverNode?: (nodeId: string | undefined) => void;
  onBeginNodePress: (nodeId: string, event: PointerEvent<SVGGElement>) => void;
  onSelectNode: (nodeId: string) => void;
};

const ButtonNode = memo(function ButtonNode({
  renderedNode,
  selected,
  pathStart,
  ascendancyClass,
  noAllocationPath,
  nodeVisualScale,
  buildGoal,
  allocated,
  allocationPath,
  hoverAllocationPath,
  debug,
  orphan,
  onShowTooltipAtPointer,
  onShowTooltipAtElement,
  onHideTooltip,
  onHoverNode,
  onBeginNodePress,
  onSelectNode,
}: ButtonNodeProps) {
  const { node, typeClass, visual, label, iconPath } = renderedNode;
  const radius = visual.coreRadius;
  const iconClipPathId = iconPath ? nodeIconClipPathId : undefined;
  const missingStats = debug.highlightMissingStats && node.stats.length === 0 && !isStatlessNodeAllowed(node);
  const handleSelect = () => onSelectNode(node.id);
  const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onShowTooltipAtElement(node, event.currentTarget);
    handleSelect();
  };
  const handleMouseEnter = (event: MouseEvent<SVGGElement>) => {
    onHoverNode?.(event.ctrlKey ? undefined : node.id);
    onShowTooltipAtPointer(node, event);
  };
  const handleMouseLeave = () => {
    onHoverNode?.(undefined);
    onHideTooltip();
  };
  const handlePointerEnter = (event: PointerEvent<SVGGElement>) => {
    onHoverNode?.(event.ctrlKey ? undefined : node.id);
    onShowTooltipAtPointer(node, event);
  };
  const handlePointerLeave = () => {
    onHoverNode?.(undefined);
    onHideTooltip();
  };
  const handleFocus = (event: FocusEvent<SVGGElement>) => {
    onHoverNode?.(node.id);
    onShowTooltipAtElement(node, event.currentTarget);
  };
  const handleBlur = () => {
    onHoverNode?.(undefined);
    onHideTooltip();
  };

  return (
    <g
      className={`tree-node ${typeClass} ${visual.accentClass}${ascendancyClass ? ` ${ascendancyClass}` : ""}${selected ? " selected" : ""}${pathStart ? " path-start" : ""}${noAllocationPath ? " no-allocation-path" : ""}${buildGoal ? " build-goal" : ""}${allocated ? " allocated" : ""}${allocationPath ? " allocation-path" : ""}${hoverAllocationPath ? " hover-allocation-path" : ""}${missingStats ? " missing-stats" : ""}${orphan ? " orphan-node" : ""}`}
      transform={`translate(${node.position.x} ${node.position.y})`}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={selected}
      onPointerDown={(event) => onBeginNodePress(node.id, event)}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <circle className="node-hit-target" r={visual.frameRadius + 16 * nodeVisualScale} />
      {orphan ? <circle className="debug-ring orphan-ring" r={radius + 14 * nodeVisualScale} /> : null}
      {missingStats ? <circle className="debug-ring missing-stats-ring" r={radius + 8 * nodeVisualScale} /> : null}
      {visual.haloRadius ? <circle className="node-halo" r={visual.haloRadius} /> : null}
      {buildGoal ? <circle className="build-goal-marker" r={visual.frameRadius + 52 * nodeVisualScale} /> : null}
      {pathStart ? <circle className="path-start-marker" r={visual.frameRadius + 44 * nodeVisualScale} /> : null}
      {hoverAllocationPath ? <circle className="hover-path-marker" r={visual.frameRadius + 24 * nodeVisualScale} /> : null}
      {noAllocationPath ? <circle className="no-path-marker" r={visual.frameRadius + 28 * nodeVisualScale} /> : null}
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
          clipPath={`url(#${iconClipPathId})`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        />
      ) : renderNodeGlyph(visual)}
      {debug.showNodeIds ? <text className="node-id-label" y={-radius - 8}>{node.id}</text> : null}
    </g>
  );
});

function SearchMatchMarker({ renderedNode, nodeVisualScale }: { renderedNode: RenderedTreeNode; nodeVisualScale: number }) {
  const { node, visual } = renderedNode;
  return (
    <g className="search-match-node" transform={`translate(${node.position.x} ${node.position.y})`}>
      <circle className="search-match-marker" r={visual.frameRadius + 7 * nodeVisualScale} />
      <circle className="search-match-core-marker" r={visual.coreRadius + 2 * nodeVisualScale} />
    </g>
  );
}

function SearchFocusMarker({ renderedNode, nodeVisualScale }: { renderedNode: RenderedTreeNode; nodeVisualScale: number }) {
  const { node, visual } = renderedNode;
  return (
    <g className="search-focus-node" transform={`translate(${node.position.x} ${node.position.y})`}>
      <circle className="search-focus-marker" r={visual.frameRadius + 18 * nodeVisualScale} />
      <circle className="search-focus-core-marker" r={visual.coreRadius + 5 * nodeVisualScale} />
    </g>
  );
}

function NodeTooltipShell({
  tooltipRef,
  titleRef,
  statsRef,
}: {
  tooltipRef: RefObject<HTMLDivElement | null>;
  titleRef: RefObject<HTMLDivElement | null>;
  statsRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={tooltipRef}
      className="node-tooltip"
      role="tooltip"
      hidden
    >
      <div ref={titleRef} className="node-tooltip-title" />
      <div ref={statsRef} className="node-tooltip-stats" />
      <div className="node-tooltip-state">Unallocated</div>
    </div>
  );
}

function tooltipStatElements(node: TreeNode): HTMLDivElement[] {
  const elements = node.stats.map((stat) => tooltipLineElement(stat));
  const masteryEffects = node.masteryEffects ?? [];

  if (masteryEffects.length > 0) {
    elements.push(tooltipLineElement("Mastery choices", "node-tooltip-section-title"));
    for (const effect of masteryEffects) {
      for (const stat of effect.stats) {
        elements.push(tooltipLineElement(stat, "node-tooltip-mastery-stat"));
      }
    }
  }

  if (elements.length === 0) return [tooltipLineElement(nodeTypeLabel(node))];
  return elements;
}

function tooltipLineElement(text: string, className?: string): HTMLDivElement {
  const element = document.createElement("div");
  if (className) element.className = className;
  element.textContent = text;
  return element;
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
    iconSize: roundNodeVisualNumber(coreRadius * nodeIconSizeMultiplier),
  };
}

function nodeRadius(node: TreeNode, nodeVisualScale: number): number {
  if (node.flags.classStart) return 26 * nodeVisualScale;
  if (node.flags.keystone) return 36 * nodeVisualScale;
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
  if (node.flags.mastery) return "Mastery";
  if (node.flags.ascendancy) return "Ascendancy passive";
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
  const text = nodeStatsAndChoicesText(node);
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

function nodeStatsAndChoicesText(node: TreeNode): string {
  return [
    ...node.stats,
    ...(node.masteryEffects?.flatMap((effect) => effect.stats) ?? []),
  ].join(" ").toLowerCase();
}

function isStatlessNodeAllowed(node: TreeNode): boolean {
  return Boolean(
    node.flags.classStart
    || node.flags.jewelSocket
    || node.flags.mastery
    || node.flags.ascendancy
    || node.masteryEffects?.length,
  );
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
