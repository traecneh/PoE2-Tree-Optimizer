// This checks arithmetic from resolved PoB inputs, not whether every modifier was resolved correctly.
export function regenerationFromInputs(input) {
  const numeric = ["pool", "flat", "percent", "increased", "more", "degenFlat", "degenPercent", "degenIncreased", "degenMore", "recoveryFlat", "recoveryRate", "overflow"];
  if (!input || numeric.some((key) => !Number.isFinite(input[key]))
    || ["disabled", "unaffected", "transferredToES"].some((key) => typeof input[key] !== "boolean")
    || input.pool < 0 || input.more < 0 || input.degenMore < 0 || input.recoveryRate < 0) return undefined;
  const raw = (input.flat + input.pool * input.percent / 100) * (1 + input.increased / 100) * input.more;
  const regeneration = input.disabled ? 0 : Math.floor(raw * 10 + 0.5) / 10;
  const baseDegen = input.degenFlat + input.pool * input.degenPercent / 100;
  const degen = baseDegen > 0 ? baseDegen * (1 + input.degenIncreased / 100) * input.degenMore : 0;
  let recovery = (input.unaffected ? 0 : regeneration) - degen + input.recoveryFlat * input.recoveryRate + input.overflow;
  if (input.transferredToES && recovery > 0) recovery = 0;
  return [regeneration, recovery].every(Number.isFinite) ? { regeneration, recovery } : undefined;
}
