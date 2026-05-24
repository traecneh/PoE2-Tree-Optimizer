import type { TreeGraph } from "./types";

export const sampleGraph: TreeGraph = {
  schemaVersion: 1,
  gameVersion: "fixture",
  extractedAt: "2026-05-24T00:00:00.000Z",
  source: { kind: "fixture", path: "src/tree/sampleGraph.ts" },
  nodes: {
    mercenary_start: {
      id: "mercenary_start",
      groupId: "g1",
      name: "Mercenary",
      stats: ["Starting point"],
      position: { x: 0, y: 0 },
      flags: { classStart: true },
    },
    projectile_damage: {
      id: "projectile_damage",
      groupId: "g1",
      name: "Projectile Damage",
      stats: ["12% increased Projectile Damage"],
      position: { x: 120, y: -40 },
      flags: { small: true },
    },
    precise_shot: {
      id: "precise_shot",
      groupId: "g1",
      name: "Precise Shot",
      stats: ["25% increased Critical Hit Chance"],
      position: { x: 240, y: 0 },
      flags: { notable: true },
    },
    jewel_socket: {
      id: "jewel_socket",
      groupId: "g2",
      name: "Jewel Socket",
      stats: [],
      position: { x: 360, y: 90 },
      flags: { jewelSocket: true },
    },
  },
  groups: {
    g1: { id: "g1", position: { x: 0, y: 0 }, nodeIds: ["mercenary_start", "projectile_damage", "precise_shot"] },
    g2: { id: "g2", position: { x: 360, y: 90 }, nodeIds: ["jewel_socket"] },
  },
  edges: [
    { from: "mercenary_start", to: "projectile_damage" },
    { from: "projectile_damage", to: "precise_shot" },
    { from: "precise_shot", to: "jewel_socket" },
  ],
  classStarts: { Mercenary: "mercenary_start" },
  bounds: { minX: 0, maxX: 360, minY: -40, maxY: 90 },
};
