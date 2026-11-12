// Independent frozen facts from the isolated PoB 0.23.1 gem and component tables.
export const plantSkillFixtures = [
  { id: "entangle", name: "Entangle", gemId: "Metadata/Items/Gems/SkillGemEntangle",
    tags: ["area", "duration", "grants_active_skill", "intelligence", "physical", "plant", "repeatable", "spell", "strength", "sustained"],
    actor: "spell", castTime: 0.9, critChance: 10,
    sets: [{ label: "Fissures", areaDamage: true, spell: true }, { label: "Vines", areaDamage: false, spell: true }],
    suggestions: ["plantDamage", "physicalDamage", "spellDamage", "spellAreaDamage", "areaOfEffect", "skillDuration", "castSpeed"] },
  { id: "briarpatch", name: "Briarpatch", gemId: "Metadata/Items/Gems/SkillGemBriarpatch",
    tags: ["area", "buff", "duration", "grants_active_skill", "intelligence", "persistent", "physical", "plant", "spell", "strength", "sustained"],
    actor: "spell", castTime: 0, critChance: 10,
    sets: [{ label: "Briarpatch", areaDamage: true, spell: true }],
    suggestions: ["plantDamage", "physicalDamage", "spellDamage", "spellAreaDamage", "areaOfEffect", "skillDuration"] },
  { id: "thrashing-vines", name: "Thrashing Vines", gemId: "Metadata/Items/Gems/SkillGemThrashingVines",
    tags: ["area", "duration", "grants_active_skill", "intelligence", "physical", "plant", "spell", "strength", "sustained"],
    actor: "spell", castTime: 1, critChance: 10,
    sets: [{ label: "Thrashing Vines", areaDamage: true, spell: true }],
    suggestions: ["plantDamage", "physicalDamage", "spellDamage", "spellAreaDamage", "areaOfEffect", "skillDuration", "castSpeed"] },
  { id: "toxic-domain", name: "Toxic Domain", gemId: "Metadata/Items/Gems/SkillGemToxicDomain",
    tags: ["area", "attack", "buff", "chaos", "dexterity", "duration", "grants_active_skill", "physical", "plant"],
    actor: "attack", castTime: 1, noAttackOrCastTime: true, cooldown: 11,
    sets: [{ label: "Toxic Bloom", dealsNoDamage: true, attack: false, areaDamage: false }, { label: "Pustule Explosion", attack: true, areaDamage: true, projectile: false }],
    suggestions: ["plantDamage", "attackDamage", "attackAreaDamage", "areaOfEffect", "cooldownRecoveryRate"] },
] as const;

export const plantIds = ["entangle", "briarpatch", "thrashing-vines", "toxic-domain"];
export const plantSpellIds = ["entangle", "briarpatch", "thrashing-vines"];
export const plantDamageNodeIds = ["12189", "16721", "18270", "20848", "32239", "32859", "34187", "56547"];

// Unconditional generic and Plant damage yield the same native average hit.
// Ratios need not equal 1.2 after rounding, mitigation and secondary effects.
export const plantModifierProbes = [
  { skill: "entangle", component: "Fissures", baseHit: 38.402547726644, plant20: 47.195581716844, generic20: 47.195581716844,
    reducedPlant20: 30.6625, spell20: 47.195581716844, attack20: 38.402547726644, area20: 47.195581716844 },
  { skill: "entangle", component: "Vines", baseHit: 9.9, plant20: 11.9625, generic20: 11.9625,
    reducedPlant20: 7.8375, spell20: 11.9625, attack20: 9.9, area20: 9.9 },
  { skill: "thrashing-vines", component: "Thrashing Vines", baseHit: 54.423739753232, plant20: 67.086509576413, generic20: 67.086509576413,
    reducedPlant20: 42.204179824957, spell20: 67.086509576413, attack20: 54.423739753232, area20: 67.086509576413 },
] as const;
