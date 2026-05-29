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

export type PobClassStartMetadata = {
  className?: string;
  ascendClassName?: string;
  allocatedNodeIds?: NodeId[];
};

export type PobClassStartResolution =
  | { kind: "matched"; source: "metadata" | "allocated-start"; option: ClassStartOption }
  | { kind: "ambiguous"; source: "allocated-start"; labels: string[] }
  | { kind: "not-found"; source: "metadata"; className?: string; ascendClassName?: string }
  | { kind: "none" };

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

export function resolveClassStartOptionFromPobMetadata(
  options: ClassStartOption[],
  metadata: PobClassStartMetadata,
): PobClassStartResolution {
  const className = normalizePobClassName(metadata.className);
  const ascendClassName = normalizePobName(metadata.ascendClassName);

  if (className) {
    const classOptions = options.filter((option) => normalizePobClassName(option.className) === className);
    if (classOptions.length === 0) {
      return {
        kind: "not-found",
        source: "metadata",
        className: metadata.className,
        ascendClassName: metadata.ascendClassName,
      };
    }

    if (ascendClassName) {
      const ascendancyOption = classOptions.find((option) => (
        option.ascendancy
        && (
          normalizePobName(option.ascendancy.name) === ascendClassName
          || normalizePobName(option.ascendancy.id) === ascendClassName
        )
      ));
      if (ascendancyOption) {
        return { kind: "matched", source: "metadata", option: ascendancyOption };
      }
    }

    return {
      kind: "matched",
      source: "metadata",
      option: classOptions.find((option) => !option.ascendancy) ?? classOptions[0],
    };
  }

  return resolveClassStartOptionFromAllocatedNodeIds(options, metadata.allocatedNodeIds ?? []);
}

function resolveClassStartOptionFromAllocatedNodeIds(
  options: ClassStartOption[],
  allocatedNodeIds: NodeId[],
): PobClassStartResolution {
  const allocatedNodeIdSet = new Set(allocatedNodeIds);
  const optionsByNodeId = new Map<NodeId, ClassStartOption[]>();
  for (const option of options) {
    const existing = optionsByNodeId.get(option.nodeId);
    if (existing) existing.push(option);
    else optionsByNodeId.set(option.nodeId, [option]);
  }

  const candidateGroups = Array.from(optionsByNodeId.entries())
    .filter(([nodeId]) => allocatedNodeIdSet.has(nodeId))
    .map(([, nodeOptions]) => nodeOptions);

  if (candidateGroups.length === 0) return { kind: "none" };

  const classNames = new Map<string, ClassStartOption[]>();
  for (const nodeOptions of candidateGroups) {
    for (const option of nodeOptions) {
      const key = normalizePobClassName(option.className);
      const existing = classNames.get(key);
      if (existing) existing.push(option);
      else classNames.set(key, [option]);
    }
  }

  if (classNames.size !== 1) {
    return {
      kind: "ambiguous",
      source: "allocated-start",
      labels: Array.from(classNames.values(), (classOptions) => (
        classOptions.find((option) => !option.ascendancy) ?? classOptions[0]
      ).label),
    };
  }

  const classOptions = Array.from(classNames.values())[0];
  return {
    kind: "matched",
    source: "allocated-start",
    option: classOptions.find((option) => !option.ascendancy) ?? classOptions[0],
  };
}

function normalizePobClassName(value: string | undefined): string {
  const normalized = normalizePobName(value);
  return classNameAliases.get(normalized) ?? normalized;
}

function normalizePobName(value: string | undefined): string {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? "";
}

const classNameAliases = new Map<string, string>([
  ["marauder", "warrior"],
  ["duelist", "mercenary"],
  ["six", "monk"],
  ["templar", "druid"],
]);

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
