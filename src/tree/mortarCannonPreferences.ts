import type { SkillPreferencePreset } from "./skillPreferencePresets";
import { attackSkillPreferencePresets } from "./attackSkillPreferencePresets";
import { remainingAttackSkillPreferencePresets } from "./remainingAttackSkillPreferencePresets";

// Explicitly checked against SupportMortarCannonPlayer, not inferred from tags.
const grenadeIds = ["explosive-grenade", "flash-grenade", "gas-grenade", "voltaic-grenade", "oil-grenade", "cluster-grenade"];
const reviewedGrenades = [...attackSkillPreferencePresets, ...remainingAttackSkillPreferencePresets];
export const mortarCannonGrenades = grenadeIds.map((id) => reviewedGrenades.find((p) => p.id === id)!);

export function normalizeSocketedGrenadeId(focusSkillId: unknown, value: unknown): string | undefined {
  return focusSkillId === "mortar-cannon" && typeof value === "string" && grenadeIds.includes(value) ? value : undefined;
}

export const mortarCannonSkillPreferencePreset: SkillPreferencePreset = {
  id: "mortar-cannon", name: "Mortar Cannon", gemId: "Metadata/Items/Gems/SkillGemMortarCannon",
  tags: ["dexterity", "duration", "grants_active_skill", "grenade", "meta", "strength", "totem"],
  passiveStatScopes: [],
  description: "Socketed-Grenade Ballista focus. The Grenade supplies the hit component; Totem firing, placement, survival and lifetime are distinct. No deployment damage, cloud/ground damage, external detonations or Full DPS is assumed.",
  suggestions: [], exclusions: [],
  sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L14109",
};

const totemSuggestions: SkillPreferencePreset["suggestions"] = [
  { id: "totemDamage", weight: 3, reason: "Totem-used Grenade hits, not deployment or Minion damage. Native damage penalties are not converted into a second preference multiplier." },
  { id: "totemAttackSpeed", weight: 1, reason: "Totem firing cadence, not player placement or fuse speed. Cooldowns can prevent faster firing, so this stays Normal priority; sustained DPS is not simulated." },
  { id: "totemPlacementSpeed", weight: 1, reason: "Player deployment utility, not the Totem's Grenade firing speed or explosion frequency." },
  { id: "totemLife", weight: 1, reason: "Totem survival, separate from player Life and Minion Life. No assumed uptime or damage multiplier." },
  { id: "totemDuration", weight: 1, reason: "The cannon's eight-second base lifetime, not Grenade fuses, clouds or ground duration." },
  { id: "totemAreaOfEffect", weight: 1, reason: "Coverage for the selected Grenade's reviewed Totem-used area hits; not guaranteed overlaps, cloud damage or player-only area." },
];
const overrides: SkillPreferencePreset["suggestions"] = [
  { id: "attackDamage", weight: 3, reason: "Totem-used Grenade hits inherit generic, Crossbow, two-handed and Grenade modifiers once each. Utility Ordnance reductions remain penalties, not extra Totem Damage copies." },
  { id: "attackSpeed", weight: 1, reason: "Inherited firing-action speed only, not placement, fuse or detonation delay. Mortar's native 50% less attack speed is not another scored passive modifier." },
  { id: "cooldownRecoveryRate", weight: 2, reason: "Generic and Grenade-specific recovery replenish the socketed skill's uses, not deployment or fuse speed. Mortar's native +100% recovery is additive with increases, not another 100% shorter cooldown." },
];
const totemExclusions: SkillPreferencePreset["exclusions"] = [
  { id: "spellDamage", reason: "The selected Grenade is a Totem-used attack, not a spell. Deployment supplies no hit damage." },
  { id: "castSpeed", reason: "Cast speed does not accelerate Totem attack firing or placement." },
  { id: "totemCastSpeed", reason: "The cannon attacks rather than casts spells." },
  { id: "minionDamage", reason: "A Ballista is a Totem, not a Minion; Minion damage is not inherited." },
  { id: "minionSpeed", reason: "Minion speed is not Totem firing or player placement speed." },
  { id: "skillDuration", reason: "Totem Duration controls cannon lifetime. Generic Skill Effect Duration is not Grenade fuse speed; cloud/ground timers are outside this hit focus." },
];

const variants = new Map(mortarCannonGrenades.map((grenade) => {
  const suggestions = grenade.suggestions.map((s) => overrides.find((override) => override.id === s.id) ?? s);
  const exclusions = new Map([...grenade.exclusions, ...totemExclusions].map((e) => [e.id, e]));
  const variant: SkillPreferencePreset = {
    ...mortarCannonSkillPreferencePreset,
    tags: [...new Set([...mortarCannonSkillPreferencePreset.tags, ...grenade.tags])].sort(),
    // Player-only debuff application scopes are not assumed to transfer to proxies.
    passiveStatScopes: grenade.passiveStatScopes?.filter((s) => !["attackBlindChance", "attackMaimChance", "attackIncisionChance"].includes(s)),
    description: `${grenade.name} hits fired by Mortar Cannon. Totem firing, cooldown recovery, placement, survival and lifetime are separate. ${["gas-grenade", "oil-grenade"].includes(grenade.id) ? "Only physical impact hits are scored, not clouds, ground effects or external ignition." : "Fuses, overlaps, external detonations and Full DPS are not simulated."}`,
    suggestions: [...totemSuggestions, ...suggestions], exclusions: [...exclusions.values()],
  };
  return [grenade.id, variant];
}));

export function mortarCannonPreset(socketedGrenadeId: unknown): SkillPreferencePreset {
  return typeof socketedGrenadeId === "string" ? variants.get(socketedGrenadeId) ?? mortarCannonSkillPreferencePreset : mortarCannonSkillPreferencePreset;
}
