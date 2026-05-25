export type Poe2StatRow = {
  _index?: number;
  Id?: string;
};

export type StatDescriptionFormatter = (statId: unknown, value: number | undefined) => string | undefined;

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

  return (statId, value) => {
    if (typeof value !== "number") return undefined;
    const statName = statNamesByIndex.get(String(statId));
    if (!statName) return undefined;
    const description = descriptionsByStat.get(statName);
    if (!description) return undefined;
    const rule = description.rules.find((candidate) => matchesCondition(candidate.condition, value)) ?? description.rules[0];
    if (!rule) return undefined;
    return renderRule(rule, value);
  };
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

function matchesCondition(condition: string, value: number): boolean {
  const range = condition.split(/\s+/).find((part) => part.includes("|") || part === "#" || isNumeric(part));
  if (!range || range === "#") return true;

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

function renderRule(rule: StatDescriptionRule, rawValue: number): string {
  const value = transformValue(rawValue, rule.transforms);
  return cleanupGameMarkup(
    rule.template.replace(/\{(\d+)(?::([^}]+))?\}/g, (_match, index: string, format: string | undefined) => {
      if (index !== "0") return "";
      return formatValue(value, format);
    }),
  );
}

function transformValue(value: number, transforms: string[]): number {
  let transformed = value;
  for (let index = 0; index < transforms.length; index += 1) {
    const transform = transforms[index];
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

function cleanupGameMarkup(text: string): string {
  return text
    .replace(/\[([^\]|]+)\|([^\]]+)\]/g, "$2")
    .replace(/\[([^\]]+)\]/g, "$1")
    .replace(/[ \t]+/g, " ")
    .trim();
}
