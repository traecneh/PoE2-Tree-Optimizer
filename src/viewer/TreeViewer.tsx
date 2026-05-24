import type { TreeGraph, TreeNode } from "../tree/types";
import { buildFitViewBox } from "./treeViewBox";

type TreeViewerProps = {
  graph: TreeGraph;
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
};

export function TreeViewer({ graph, selectedNodeId, onSelectNode }: TreeViewerProps) {
  return (
    <svg className="tree-svg" viewBox={buildFitViewBox(graph.bounds, 160)} role="img" aria-label="PoE2 passive skill tree">
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
            onSelectNode={onSelectNode}
          />
        ))}
      </g>
    </svg>
  );
}

function ButtonNode({ node, selected, onSelectNode }: { node: TreeNode; selected: boolean; onSelectNode: (nodeId: string) => void }) {
  const radius = nodeRadius(node);
  return (
    <g className={`tree-node ${nodeClass(node)}${selected ? " selected" : ""}`} transform={`translate(${node.position.x} ${node.position.y})`}>
      <circle r={radius} onClick={() => onSelectNode(node.id)}>
        <title>{node.name ?? node.id}</title>
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
