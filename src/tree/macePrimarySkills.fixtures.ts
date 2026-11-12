// Frozen native identities and MAIN observations, independent of preset construction.
export const macePrimaryFixtures = [
  { id: "earthquake",name: "Earthquake",effectId: "EarthquakePlayer",set: 1,tags: ["area","attack","duration","grants_active_skill","melee","slam","strength"],
    phys: [16,23],fire: [0,0],hit: 20.475,mana: 56,magCost: 72,effCost: 34,brutCost: 67,radius: 18,magRadius: 21,concRadius: 12,speed: .825,rapid: 1.03125 },
  { id: "earthshatter",name: "Earthshatter",effectId: "EarthshatterPlayer",set: 1,tags: ["area","attack","duration","grants_active_skill","melee","slam","strength"],
    phys: [18,25],fire: [0,0],hit: 22.575,mana: 51,magCost: 66,effCost: 31,brutCost: 61,radius: 10,magRadius: 12,concRadius: 7,speed: .88,rapid: 1.1 },
  { id: "sunder",name: "Sunder",effectId: "SunderPlayer",set: 1,tags: ["area","attack","duration","grants_active_skill","melee","payoff","slam","strength"],
    phys: [85,118],fire: [0,0],hit: 106.575,mana: 106,magCost: 137,effCost: 64,brutCost: 127,radius: 9,magRadius: 10,concRadius: 6,speed: .44,rapid: .55 },
  { id: "supercharged-slam",name: "Supercharged Slam",effectId: "SuperchargedSlamPlayer",set: 1,tags: ["area","attack","channelling","grants_active_skill","melee","slam","stages","strength"],
    phys: [46,64],fire: [0,0],hit: 57.75,mana: 0,channelCost: 53,magChannel: 69,effChannel: 32,brutChannel: 64,radius: 16,magRadius: 19,concRadius: 11,speed: 1.1,rapid: 1.375 },
  { id: "stampede",name: "Stampede",effectId: "StampedePlayer",set: 2,tags: ["area","attack","duration","grants_active_skill","melee","slam","strength","travel"],
    phys: [49,67],fire: [0,0],hit: 60.9,mana: 65,magCost: 84,effCost: 39,brutCost: 78,radius: 32,magRadius: 38,concRadius: 22,speed: 1.1,rapid: 1.375 },
  { id: "leap-slam",name: "Leap Slam",effectId: "LeapSlamPlayer",set: 1,tags: ["area","attack","grants_active_skill","melee","payoff","slam","strength","travel"],
    phys: [58,81],fire: [0,0],hit: 72.975,mana: 97,magCost: 126,effCost: 59,brutCost: 116,radius: 25,magRadius: 30,concRadius: 17,speed: .64139941690962,rapid: .72607260726073 },
  { id: "hammer-of-the-gods",name: "Hammer of the Gods",effectId: "HammerOfTheGodsPlayer",set: 1,tags: ["area","attack","conditional","duration","grants_active_skill","melee","slam","strength"],
    phys: [199,275],fire: [0,0],hit: 248.85,mana: 73,magCost: 94,effCost: 44,brutCost: 87,radius: 24,magRadius: 28,concRadius: 16,speed: .55,rapid: .6875 },
  { id: "volcanic-fissure",name: "Volcanic Fissure",effectId: "VolcanicFissurePlayer",set: 1,tags: ["area","attack","duration","fire","grants_active_skill","melee","slam","strength","sustained"],
    phys: [4,6],fire: [17,24],hit: 26.775,mana: 41,magCost: 53,effCost: 25,brutCost: 49,speed: .88,rapid: 1.1 },
] as const;
export const macePrimarySupportIds = ["magnified-area-i","magnified-area-ii","efficiency-i","efficiency-ii","rapid-attacks-i","rapid-attacks-ii","concentrated-area","brutality-i","brutality-ii","brutality-iii"];
export const macePrimaryIds = macePrimaryFixtures.map(f => f.id);
export const macePrimaryGemIds: Record<string,string> = {
  earthquake: "Metadata/Items/Gems/SkillGemEarthquake",
  earthshatter: "Metadata/Items/Gems/SkillGemEarthshatter",
  sunder: "Metadata/Items/Gems/SkillGemSunder",
  "supercharged-slam": "Metadata/Items/Gems/SkillGemSuperchargedSlam",
  stampede: "Metadata/Items/Gems/SkillGemStampede",
  "leap-slam": "Metadata/Items/Gems/SkillGemLeapSlam",
  "hammer-of-the-gods": "Metadata/Items/Gems/SkillGemHammerOfTheGods",
  "volcanic-fissure": "Metadata/Items/Gems/SkillGemVolcanicFissure",
};
