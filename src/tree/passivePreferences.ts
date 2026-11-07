import type { TreeNode } from "./types";
import { maxPassiveAllocationPointCount } from "./passivePointBudget";

export const passivePreferenceCatalog = [
  { id: "life", label: "Maximum Life", group: "Defence", unit: "3% increased maximum Life or +10 Life", scale: 3 },
  { id: "energyShield", label: "Energy Shield", group: "Defence", unit: "12% increased Energy Shield or +20 Energy Shield", scale: 12 },
  { id: "armour", label: "Armour", group: "Defence", unit: "12% increased Armour", scale: 12 },
  { id: "evasion", label: "Evasion", group: "Defence", unit: "12% increased Evasion Rating", scale: 12 },
  { id: "minionDamage", label: "Minion Damage", group: "Offence", unit: "10% increased Minion Damage", scale: 10 },
  { id: "minionSpeed", label: "Minion Attack / Cast Speed", group: "Offence", unit: "3% increased minion Attack or Cast Speed (each)", scale: 3 },
  { id: "attackDamage", label: "Attack Damage", group: "Offence", unit: "10% increased Attack Damage", scale: 10 },
  { id: "spellDamage", label: "Spell Damage", group: "Offence", unit: "10% increased Spell Damage", scale: 10 },
  { id: "physicalDamage", label: "Physical Damage", group: "Offence", unit: "10% increased Physical Damage", scale: 10 },
  { id: "elementalDamage", label: "Elemental Damage", group: "Offence", unit: "10% increased Elemental Damage", scale: 10 },
  { id: "fireDamage", label: "Fire Damage", group: "Offence", unit: "10% increased Fire Damage", scale: 10 },
  { id: "coldDamage", label: "Cold Damage", group: "Offence", unit: "10% increased Cold Damage", scale: 10 },
  { id: "lightningDamage", label: "Lightning Damage", group: "Offence", unit: "10% increased Lightning Damage", scale: 10 },
  { id: "chaosDamage", label: "Chaos Damage", group: "Offence", unit: "10% increased Chaos Damage", scale: 10 },
  { id: "attackSpeed", label: "Attack Speed", group: "Offence", unit: "3% increased Attack Speed", scale: 3 },
  { id: "castSpeed", label: "Cast Speed", group: "Offence", unit: "3% increased Cast Speed", scale: 3 },
  { id: "criticalChance", label: "Critical Hit Chance", group: "Offence", unit: "15% increased Critical Hit Chance", scale: 15 },
  { id: "attributes", label: "Attributes", group: "Utility", unit: "+5 total Attributes (any Attribute counts once)", scale: 5 },
  { id: "mana", label: "Maximum Mana", group: "Utility", unit: "10% increased maximum Mana or +15 Mana", scale: 10 },
  { id: "movementSpeed", label: "Movement Speed", group: "Utility", unit: "2% increased Movement Speed", scale: 2 },
  { id: "jewelSockets", label: "Jewel Sockets", group: "Utility", unit: "one empty Jewel Socket (not its jewel effects)", scale: 1 },
] as const;

export type PassivePreferenceId = typeof passivePreferenceCatalog[number]["id"];
export type PassivePreference = { id: PassivePreferenceId; weight: number };
export type PassiveOptimizationSettings = {
  mode: "shortest" | "weighted";
  extraPointBudget: number;
  pointBudgetMode?: "extra" | "all-available";
  preferences: PassivePreference[];
};
export type PassivePreferenceContribution = { id: PassivePreferenceId; label: string; score: number; nodeCount: number };
export type WeightedRouteScore = {
  score: number;
  baselinePointCost: number;
  maxPointCost: number;
  baselineExact: boolean;
  contributions: PassivePreferenceContribution[];
  stage?: "baseline" | "preferences";
  pointBudgetMode?: "all-available";
  basePointCost?: number;
  totalPointLimit?: number;
};

export function defaultPassiveOptimizationSettings(): PassiveOptimizationSettings {
  return { mode: "shortest", extraPointBudget: 5, preferences: [] };
}

export function normalizePassiveOptimizationSettings(value: unknown): PassiveOptimizationSettings {
  const defaults = defaultPassiveOptimizationSettings();
  if (!value || typeof value !== "object") return defaults;
  const record = value as Record<string, unknown>;
  const preferences = new Map<PassivePreferenceId, PassivePreference>();
  if (Array.isArray(record.preferences)) {
    for (const item of record.preferences) {
      if (!item || typeof item !== "object") continue;
      const { id, weight } = item as Record<string, unknown>;
      if (!passivePreferenceCatalog.some((effect) => effect.id === id)) continue;
      if (typeof weight !== "number" || !Number.isFinite(weight) || weight <= 0) continue;
      preferences.set(id as PassivePreferenceId, { id: id as PassivePreferenceId, weight: Math.min(3, Math.max(1, Math.round(weight))) });
    }
  }
  return {
    mode: record.mode === "weighted" ? "weighted" : "shortest",
    extraPointBudget: typeof record.extraPointBudget === "number" && Number.isFinite(record.extraPointBudget)
      ? Math.min(maxPassiveAllocationPointCount, Math.max(0, Math.floor(record.extraPointBudget))) : defaults.extraPointBudget,
    ...(record.pointBudgetMode === "all-available" ? { pointBudgetMode: "all-available" as const } : {}),
    preferences: [...preferences.values()],
  };
}

// Only full, unconditional stat lines are recognized. Generic name/substring matches
// would incorrectly reward minion stats, conditional bonuses, or conversions.
export function passivePreferenceValues(node: TreeNode): Partial<Record<PassivePreferenceId, number>> {
  const values: Partial<Record<PassivePreferenceId, number>> = {};
  const add = (id: PassivePreferenceId, value: number) => { values[id] = (values[id] ?? 0) + value; };
  const stats: Record<string, PassivePreferenceId> = {
    "maximum life": "life", "maximum mana": "mana", "maximum energy shield": "energyShield",
    "energy shield": "energyShield", armour: "armour", "evasion rating": "evasion", evasion: "evasion",
    "minion damage": "minionDamage", "attack damage": "attackDamage", "spell damage": "spellDamage",
    "physical damage": "physicalDamage", "elemental damage": "elementalDamage", "fire damage": "fireDamage",
    "cold damage": "coldDamage", "lightning damage": "lightningDamage", "chaos damage": "chaosDamage",
    "attack speed": "attackSpeed", "cast speed": "castSpeed", "movement speed": "movementSpeed",
    "critical hit chance": "criticalChance", "critical strike chance": "criticalChance",
  };
  for (const rawLine of node.stats) {
    const line = rawLine.trim().replace(/\s+/g, " ").toLowerCase();
    const percent = /^([\d.]+)% (increased|reduced) (.+)$/.exec(line);
    if (percent) {
      const value = Number(percent[1]) * (percent[2] === "reduced" ? -1 : 1);
      const labels = percent[3].replace(/^maximum life, mana and energy shield$/, "maximum life, maximum mana and maximum energy shield")
        .replace(/^attack and cast speed$/, "attack speed and cast speed")
        .split(/,\s*(?:and\s+)?| and /);
      for (const label of labels.every((label) => stats[label]) ? labels : []) {
        const id = stats[label];
        if (id) add(id, value);
      }
    }
    const minionDamage = /^minions deal ([\d.]+)% (increased|reduced) damage$/.exec(line);
    if (minionDamage) add("minionDamage", Number(minionDamage[1]) * (minionDamage[2] === "reduced" ? -1 : 1));
    const minionSpeed = /^minions have ([\d.]+)% (increased|reduced) (attack|cast|attack and cast) speed$/.exec(line);
    if (minionSpeed) add("minionSpeed", Number(minionSpeed[1]) * (minionSpeed[2] === "reduced" ? -1 : 1) * (minionSpeed[3] === "attack and cast" ? 2 : 1));
    const attributes = /^([+-][\d.]+) to (strength|dexterity|intelligence|any attribute|all attributes|(?:strength|dexterity|intelligence) and (?:strength|dexterity|intelligence))$/.exec(line);
    if (attributes) add("attributes", Number(attributes[1]) * (attributes[2] === "all attributes" ? 3 : attributes[2].includes(" and ") ? 2 : 1));
    const flat = /^([+-][\d.]+) to maximum (life|mana|energy shield)$/.exec(line);
    if (flat) {
      const id = flat[2] === "life" ? "life" : flat[2] === "mana" ? "mana" : "energyShield";
      const divisor = id === "life" ? 10 / 3 : id === "mana" ? 15 / 10 : 20 / 12;
      add(id, Number(flat[1]) / divisor);
    }
  }
  if (node.flags.jewelSocket) add("jewelSockets", 1);
  return values;
}

export function scorePassiveNode(node: TreeNode, preferences: PassivePreference[]): number {
  const values = passivePreferenceValues(node);
  return preferences.reduce((score, preference) => score + (values[preference.id] ?? 0)
    / passivePreferenceCatalog.find((effect) => effect.id === preference.id)!.scale * preference.weight, 0);
}
