import type { NodeId, TreeGraph } from "./types";

export type BuildSummarySummedStat = {
  key: string;
  label: string;
  value: number;
  formattedValue: string;
  unit: "%" | "";
  text: string;
  sourceNodeIds: NodeId[];
  sourceNodeNames: string[];
};

export type BuildSummaryOtherStat = {
  text: string;
  count: number;
  sourceNodeIds: NodeId[];
  sourceNodeNames: string[];
};

export type BuildSummary = {
  pointCount: number;
  nodeCount: number;
  summedStats: BuildSummarySummedStat[];
  otherStats: BuildSummaryOtherStat[];
};

export type BuildSummaryOptions = {
  pointCostByNodeId?: ReadonlyMap<NodeId, number>;
};

type ParsedSummableStat = {
  value: number;
  unit: "%" | "";
  label: string;
  prefix: string;
  suffix: string;
  key: string;
  explicitPositiveSign: boolean;
};

type SummedStatAccumulator = ParsedSummableStat & {
  sourceNodeIds: NodeId[];
  sourceNodeNames: string[];
};

type OtherStatAccumulator = {
  text: string;
  count: number;
  sourceNodeIds: NodeId[];
  sourceNodeNames: string[];
};

export function buildSummary(
  graph: TreeGraph,
  visibleNodeIds: Iterable<NodeId>,
  options: BuildSummaryOptions = {},
): BuildSummary {
  const uniqueNodeIds = Array.from(new Set(visibleNodeIds));
  const summedStats = new Map<string, SummedStatAccumulator>();
  const otherStats = new Map<string, OtherStatAccumulator>();
  let pointCount = 0;
  let nodeCount = 0;

  for (const nodeId of uniqueNodeIds) {
    const node = graph.nodes[nodeId];
    if (!node) continue;

    nodeCount += 1;

    pointCount += options.pointCostByNodeId?.get(nodeId) ?? (node.flags.classStart ? 0 : 1);

    if (node.flags.classStart) continue;

    for (const rawStat of node.stats) {
      const stat = normalizeStatText(rawStat);
      if (!stat) continue;
      const sourceNodeName = node.name ?? nodeId;

      const parsed = parseSummableStat(stat);
      if (!parsed) {
        const existingOther = otherStats.get(stat);
        if (existingOther) {
          existingOther.count += 1;
          existingOther.sourceNodeIds.push(nodeId);
          existingOther.sourceNodeNames.push(sourceNodeName);
        } else {
          otherStats.set(stat, { text: stat, count: 1, sourceNodeIds: [nodeId], sourceNodeNames: [sourceNodeName] });
        }
        continue;
      }

      const existingSummed = summedStats.get(parsed.key);
      if (existingSummed) {
        existingSummed.value += parsed.value;
        existingSummed.sourceNodeIds.push(nodeId);
        existingSummed.sourceNodeNames.push(sourceNodeName);
      } else {
        summedStats.set(parsed.key, { ...parsed, sourceNodeIds: [nodeId], sourceNodeNames: [sourceNodeName] });
      }
    }
  }

  return {
    pointCount,
    nodeCount,
    summedStats: Array.from(summedStats.values()).map(formatSummedStat),
    otherStats: Array.from(otherStats.values()),
  };
}

function parseSummableStat(stat: string): ParsedSummableStat | undefined {
  const percentMatch = /^([+-]?\d+(?:\.\d+)?)%\s+(.+)$/.exec(stat);
  if (percentMatch) {
    const [, rawValue, rawLabel] = percentMatch;
    const label = normalizeStatText(rawLabel);
    return parsedStat({
      value: Number(rawValue),
      unit: "%",
      label,
      prefix: "",
      suffix: ` ${label}`,
      keyLabel: label,
      explicitPositiveSign: rawValue.startsWith("+"),
    });
  }

  const flatMatch = /^([+-]\d+(?:\.\d+)?)\s+(.+)$/.exec(stat);
  if (flatMatch) {
    const [, rawValue, rawLabel] = flatMatch;
    const label = normalizeStatText(rawLabel);
    return parsedStat({
      value: Number(rawValue),
      unit: "",
      label,
      prefix: "",
      suffix: ` ${label}`,
      keyLabel: label,
      explicitPositiveSign: rawValue.startsWith("+"),
    });
  }

  const embeddedMatch = /^(.+\s)([+-]?\d+(?:\.\d+)?)(%)?(\s+.+)$/.exec(stat);
  if (embeddedMatch) {
    const [, rawPrefix, rawValue, rawUnit = "", rawSuffix] = embeddedMatch;
    const prefix = normalizeStatText(rawPrefix);
    const suffix = normalizeStatText(rawSuffix);
    const unit = rawUnit === "%" ? "%" : "";

    if ((unit || /^[+-]/.test(rawValue)) && isSummableEmbeddedPrefix(prefix)) {
      return parsedStat({
        value: Number(rawValue),
        unit,
        label: suffix,
        prefix: `${prefix} `,
        suffix: ` ${suffix}`,
        keyLabel: `${prefix.toLowerCase()} <> ${suffix.toLowerCase()}`,
        explicitPositiveSign: rawValue.startsWith("+"),
      });
    }
  }

  return undefined;
}

function parsedStat(stat: {
  value: number;
  unit: "%" | "";
  label: string;
  prefix: string;
  suffix: string;
  keyLabel: string;
  explicitPositiveSign: boolean;
}): ParsedSummableStat | undefined {
  if (!Number.isFinite(stat.value) || !stat.label) return undefined;

  return {
    value: stat.value,
    unit: stat.unit,
    label: stat.label,
    prefix: stat.prefix,
    suffix: stat.suffix,
    explicitPositiveSign: stat.explicitPositiveSign,
    key: `${stat.unit}:${stat.keyLabel.toLowerCase()}`,
  };
}

function isSummableEmbeddedPrefix(prefix: string): boolean {
  return /\b(have|has|deal|deals|gain|gains|grant|grants)$/i.test(prefix);
}

function formatSummedStat(stat: SummedStatAccumulator): BuildSummarySummedStat {
  const formattedValue = formatStatValue(stat.value, stat.unit, stat.explicitPositiveSign);
  return {
    key: stat.key,
    label: stat.label,
    value: stat.value,
    formattedValue,
    unit: stat.unit,
    text: `${stat.prefix}${formattedValue}${stat.unit}${stat.suffix}`,
    sourceNodeIds: stat.sourceNodeIds,
    sourceNodeNames: stat.sourceNodeNames,
  };
}

function formatStatValue(value: number, unit: "%" | "", explicitPositiveSign: boolean): string {
  const rounded = roundStatValue(value);
  const formatted = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  if (rounded > 0 && (explicitPositiveSign || unit === "")) {
    return `+${formatted}`;
  }
  return formatted;
}

function roundStatValue(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

function normalizeStatText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}
