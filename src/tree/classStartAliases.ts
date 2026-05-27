import type { ClassId, NodeId, TreeGraph } from "./types";

export type ClassStartOption = {
  id: string;
  label: string;
  className: string;
  rootClassId: ClassId;
  nodeId: NodeId;
  ascendancy?: {
    id: string;
    name: string;
    startNodeId: NodeId;
  };
};

const poe2ClassStartAliases: Array<Omit<ClassStartOption, "nodeId" | "ascendancy">> = [
  { id: "witch", label: "Witch", className: "Witch", rootClassId: "WITCH" },
  { id: "ranger", label: "Ranger", className: "Ranger", rootClassId: "RANGER" },
  { id: "warrior", label: "Warrior", className: "Warrior", rootClassId: "MARAUDER" },
  { id: "sorceress", label: "Sorceress", className: "Sorceress", rootClassId: "WITCH" },
  { id: "huntress", label: "Huntress", className: "Huntress", rootClassId: "RANGER" },
  { id: "mercenary", label: "Mercenary", className: "Mercenary", rootClassId: "DUELIST" },
  { id: "monk", label: "Monk", className: "Monk", rootClassId: "SIX" },
  { id: "druid", label: "Druid", className: "Druid", rootClassId: "TEMPLAR" },
];

export function buildClassStartOptions(graph: TreeGraph): ClassStartOption[] {
  const aliasOptions = poe2ClassStartAliases.flatMap((alias) => {
    const nodeId = graph.classStarts[alias.rootClassId];
    if (!nodeId || !graph.nodes[nodeId]) return [];

    const baseOption = { ...alias, nodeId };
    const ascendancyOptions = activeAscendancyStartsForClass(graph, alias.className).map((ascendancy) => ({
      ...alias,
      id: `${alias.id}:${ascendancy.id}`,
      label: `${alias.label} - ${ascendancy.name}`,
      nodeId,
      ascendancy,
    }));
    return [baseOption, ...ascendancyOptions];
  });

  if (aliasOptions.length > 0) return aliasOptions;

  return Object.entries(graph.classStarts)
    .filter(([, nodeId]) => Boolean(graph.nodes[nodeId]))
    .map(([classId, nodeId]) => ({
      id: classId,
      label: classId,
      className: classId,
      rootClassId: classId,
      nodeId,
    }));
}

function activeAscendancyStartsForClass(
  graph: TreeGraph,
  className: string,
): NonNullable<ClassStartOption["ascendancy"]>[] {
  const seen = new Set<string>();
  return Object.values(graph.nodes)
    .flatMap((node) => {
      const ascendancy = node.ascendancy;
      if (
        !ascendancy
        || ascendancy.className !== className
        || !ascendancy.startNode
        || ascendancy.disabled
        || !isUserFacingAscendancyName(ascendancy.name)
        || seen.has(ascendancy.id)
      ) {
        return [];
      }

      seen.add(ascendancy.id);
      return [{
        id: ascendancy.id,
        name: ascendancy.name,
        startNodeId: node.id,
      }];
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function isUserFacingAscendancyName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return normalized.length > 0 && !normalized.includes("dnt");
}
