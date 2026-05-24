// The PSG stores orbit indexes but not the concrete radius values used by the client.
export const POE2_ORBIT_RADII = [0, 82, 162, 335, 493, 662, 846, 249, 1020, 1200] as const;

export function getPoe2OrbitRadius(orbit: number): number | undefined {
  return POE2_ORBIT_RADII[orbit];
}
