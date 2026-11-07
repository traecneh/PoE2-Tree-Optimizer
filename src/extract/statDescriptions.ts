export type Poe2StatRow = {
  _index?: number;
  Id?: string;
};

export type StatDescriptionFormatter = {
  (statId: unknown, value: number | undefined): string | undefined;
  // Results align with input stats; an empty string suppresses a consumed group member.
  formatAll?: (statIds: readonly unknown[], values: readonly (number | undefined)[]) => (string | undefined)[];
};

type StatDescriptionRule = {
  condition: string;
  template: string;
  transforms: string[];
};

type StatDescription = {
  statNames: string[];
  rules: StatDescriptionRule[];
};

export function createStatDescriptionFormatter(input: {
  stats: Poe2StatRow[];
  descriptions: string[];
}): StatDescriptionFormatter {
  const statNamesByIndex = new Map<string, string>();
  input.stats.forEach((row, index) => {
    if (typeof row.Id !== "string" || row.Id.trim() === "") return;
    statNamesByIndex.set(String(row._index ?? index), row.Id);
  });

  const descriptionsByStat = new Map<string, StatDescription>();
  for (const text of input.descriptions) {
    for (const description of parseStatDescriptions(text)) {
      for (const statName of description.statNames) {
        descriptionsByStat.set(statName, description);
      }
    }
  }

  const formatOne: StatDescriptionFormatter = (statId, value) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
    const statName = statNamesByIndex.get(String(statId));
    if (!statName) return undefined;
    if (isNoDisplayStat(statName)) return "";
    const description = descriptionsByStat.get(statName);
    if (!description || description.statNames.length !== 1) return formatUndescribedStat(statName, value);
    const rule = description.rules.find((candidate) => matchesCondition(candidate.condition, [value])) ?? description.rules[0];
    if (!rule) return undefined;
    return renderRule(rule, [value]);
  };

  formatOne.formatAll = (statIds, values) => {
    const formatted = statIds.map((statId, index) => formatOne(statId, values[index]));
    const indexesByName = new Map<string, number>();
    statIds.forEach((statId, index) => {
      const name = statNamesByIndex.get(String(statId));
      if (name && !indexesByName.has(name)) indexesByName.set(name, index);
    });
    const consumed = new Set<number>();

    for (let index = 0; index < statIds.length; index += 1) {
      if (consumed.has(index)) continue;
      const name = statNamesByIndex.get(String(statIds[index]));
      const description = name ? descriptionsByStat.get(name) : undefined;
      if (!description || description.statNames.length < 2) continue;
      const groupIndexes = description.statNames.map((statName) => indexesByName.get(statName));
      if (description.statNames.some((statName) => descriptionsByStat.get(statName) !== description)) continue;
      const indexes = groupIndexes.filter((groupIndex): groupIndex is number => groupIndex !== undefined);
      if (indexes.some((groupIndex) => consumed.has(groupIndex) || !Number.isFinite(values[groupIndex]))) continue;
      const groupValues = groupIndexes.map((groupIndex) => groupIndex === undefined ? undefined : values[groupIndex]);
      // Absent flags default to zero for rule selection; missing displayed values stay unknown.
      const rule = description.rules.find((candidate) => matchesCondition(candidate.condition, groupValues.map((value) => value ?? 0)));
      if (!rule) continue;
      const text = renderRule(rule, groupValues);
      if (text === undefined) continue;

      for (const groupIndex of indexes) {
        formatted[groupIndex] = "";
        consumed.add(groupIndex);
      }
      formatted[Math.min(...indexes)] = text;
    }
    return formatted;
  };
  return formatOne;
}

export function decodeStatDescriptionText(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  }

  return new TextDecoder("utf-8").decode(bytes);
}

function parseStatDescriptions(text: string): StatDescription[] {
  const normalized = text.replace(/\r\n/g, "\n");
  const descriptions: StatDescription[] = [];
  const blockPattern = /(?:^|\n)description\n([\s\S]*?)(?=\ndescription\n|$)/g;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(normalized)) !== null) {
    const description = parseDescriptionBlock(match[1]);
    if (description) descriptions.push(description);
  }

  return descriptions;
}

function parseDescriptionBlock(block: string): StatDescription | undefined {
  const lines = block.split("\n");
  const headerIndex = lines.findIndex((line) => line.trim() !== "");
  if (headerIndex === -1) return undefined;

  const header = lines[headerIndex].trim().match(/^(\d+)\s+(.+)$/);
  if (!header) return undefined;

  const statCount = Number(header[1]);
  const statNames = header[2].trim().split(/\s+/).slice(0, statCount);
  if (statNames.length === 0) return undefined;

  const ruleCountIndex = findNextNonEmptyLine(lines, headerIndex + 1);
  if (ruleCountIndex === -1) return undefined;
  const ruleCount = Number(lines[ruleCountIndex].trim());
  if (!Number.isInteger(ruleCount) || ruleCount < 1) return undefined;

  const rules: StatDescriptionRule[] = [];
  for (let index = ruleCountIndex + 1; index < lines.length && rules.length < ruleCount; index += 1) {
    const line = lines[index].trim();
    if (line === "") continue;
    if (line.startsWith("lang ")) break;
    const rule = parseRule(line);
    if (rule) rules.push(rule);
  }

  if (rules.length === 0) return undefined;
  return { statNames, rules };
}

function findNextNonEmptyLine(lines: string[], startIndex: number): number {
  for (let index = startIndex; index < lines.length; index += 1) {
    if (lines[index].trim() !== "") return index;
  }
  return -1;
}

function parseRule(line: string): StatDescriptionRule | undefined {
  const match = line.match(/^(.*?)"((?:[^"\\]|\\.)*)"\s*(.*)$/);
  if (!match) return undefined;
  return {
    condition: match[1].trim(),
    template: unescapeTemplate(match[2]),
    transforms: match[3].trim().split(/\s+/).filter(Boolean),
  };
}

function unescapeTemplate(template: string): string {
  return template.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}

function matchesCondition(condition: string, values: readonly number[]): boolean {
  const ranges = condition.split(/\s+/);
  return values.every((value, index) => matchesRange(ranges[index] ?? "#", value));
}

function matchesRange(range: string, value: number): boolean {
  if (range === "#") return true;
  if (range.startsWith("!") && isNumeric(range.slice(1))) return value !== Number(range.slice(1));

  const [minToken, maxToken] = range.includes("|") ? range.split("|") : [range, range];
  const min = minToken === "#" ? Number.NEGATIVE_INFINITY : Number(minToken);
  const max = maxToken === "#" ? Number.POSITIVE_INFINITY : Number(maxToken);
  if (!Number.isFinite(min) && min !== Number.NEGATIVE_INFINITY) return false;
  if (!Number.isFinite(max) && max !== Number.POSITIVE_INFINITY) return false;
  return value >= min && value <= max;
}

function isNumeric(value: string): boolean {
  return value.trim() !== "" && Number.isFinite(Number(value));
}

function renderRule(rule: StatDescriptionRule, rawValues: readonly (number | undefined)[]): string | undefined {
  let complete = true;
  const text = rule.template.replace(/\{(\d*)(?::([^}]+))?\}/g, (_match, index: string, format: string | undefined) => {
    const valueIndex = index === "" ? 0 : Number(index);
    const value = rawValues[valueIndex];
    if (value === undefined) {
      complete = false;
      return "";
    }
    return formatValue(transformValue(value, rule.transforms, valueIndex), format);
  });
  return complete ? cleanupGameMarkup(text) : undefined;
}

function transformValue(value: number, transforms: string[], valueIndex: number): number {
  let transformed = value;
  for (let index = 0; index < transforms.length; index += 1) {
    const transform = transforms[index];
    const target = transforms[index + 1];
    if (target !== undefined && isNumeric(target)) {
      index += 1;
      if (Number(target) !== valueIndex + 1) continue;
    }
    if (transform === "negate") transformed = -transformed;
    else if (transform === "per_minute_to_per_second" || transform === "per_minute_to_per_second_2dp_if_required") {
      transformed /= 60;
    } else if (transform === "divide_by_one_hundred") {
      transformed /= 100;
    } else if (transform === "milliseconds_to_seconds" || transform === "milliseconds_to_seconds_2dp_if_required") {
      transformed /= 1000;
    } else if (transform === "divide_by_ten_1dp_if_required") {
      transformed /= 10;
    }
  }
  return transformed;
}

function formatValue(value: number, format: string | undefined): string {
  const rounded = roundDisplayNumber(value);
  if (format === "+d") return rounded > 0 ? `+${formatDisplayNumber(rounded)}` : formatDisplayNumber(rounded);
  return formatDisplayNumber(rounded);
}

function roundDisplayNumber(value: number): number {
  return Number(value.toFixed(4));
}

function formatDisplayNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value).replace(/0+$/, "").replace(/\.$/, "");
}

function formatUndescribedStat(statName: string, value: number): string {
  const hasPercentUnit = statName.includes("%");
  const label = humanizeStatName(statName);
  if (value === 1 && !hasPercentUnit && !hasExplicitMagnitude(statName)) return label;
  if (hasPercentUnit) return `${formatDisplayNumber(value)}% ${label}`;
  return `${formatDisplayNumber(value)} ${label}`;
}

function humanizeStatName(statName: string): string {
  return statName
    .replace(/_%_/g, "_")
    .replace(/_\+_/g, "_")
    .replace(/_\+$/g, "")
    .replace(/_ms$/g, " ms")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();
}

function hasExplicitMagnitude(statName: string): boolean {
  return /(?:^|_)(?:min|minimum|max|maximum|base|additional|number|stacks?|allowed)(?:_|$)/.test(statName);
}

function isNoDisplayStat(statName: string): boolean {
  return statName === "dummy_stat_display_nothing" || statName.includes("_no_display");
}

function cleanupGameMarkup(text: string): string {
  return text
    .replace(/\[([^\]|]+)\|([^\]]+)\]/g, "$2")
    .replace(/\[([^\]]+)\]/g, "$1")
    .replace(/[ \t]+/g, " ")
    .trim();
}
