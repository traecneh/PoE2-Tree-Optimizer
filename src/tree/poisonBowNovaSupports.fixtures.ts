// Independent frozen PoB 0.23.1 observations: empty Witch, Physical Crude Bow.
export const poisonBowNovaSupportFixtures = [
  { id: "nova-projectiles-i", name: "Nova Projectiles I", effectId: "SupportNovaProjectilesPlayer", family: "NovaProjectiles", additionalFamilies: [], catalogTier: 2, extraProjectiles: 0, lessDamage: 0, baseCooldown: 0, line: 3315 },
  { id: "nova-projectiles-ii", name: "Nova Projectiles II", effectId: "SupportNovaProjectilesTwoPlayer", family: "NovaProjectiles", additionalFamilies: ["AdditionalProjectiles"], catalogTier: 4, extraProjectiles: 6, lessDamage: 50, baseCooldown: 8, line: 3343 },
] as const;

// Baseline / I / II. Source fields for no-hit components are not real contacts.
export const poisonBowNovaComponents = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, hits: [5.38125,5.38125,2.625], ranges: [[16,25],[16,25],[8,12]] },
  { skill: "poisonburst-arrow", component: "burst source", actualHit: false, hits: [5.38125,5.38125,2.625], ranges: [[16,25],[16,25],[8,12]] },
  { skill: "gas-arrow", component: "arrow", actualHit: true, hits: [1.8375,1.8375,.91875], ranges: [[6,8],[6,8],[3,4]] },
  { skill: "gas-arrow", component: "cloud source", actualHit: false, hits: [4.33125,4.33125,2.23125], ranges: [[13,20],[13,20],[7,10]] },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, hits: [22.05,22.05,11.55], ranges: [[17,25],[17,25],[9,13]] },
] as const;

export const poisonBowNovaSources = [
  { skill: "poisonburst-arrow", poison: [5.385766215481,5.385766215481,.78563411896745], damageOnly: 2.6014267003078,
    recovery100: 1.5648286140089, multishotIIWithNovaI: 3.7426411086426, duration: 3, mana: 38, efficiencyMana: 23, poisonIIIMana: 45, timer: 3.003, radius: 24 },
  { skill: "gas-arrow", poison: [4.0038541776187,4.0038541776187,.44519266741489], damageOnly: 2.0347455656751,
    recovery100: .88673621460507, multishotIIWithNovaI: 2.9067817669733, duration: 2, mana: 62, efficiencyMana: 38, poisonIIIMana: 74, timer: 4.026, radius: 18 },
] as const;
