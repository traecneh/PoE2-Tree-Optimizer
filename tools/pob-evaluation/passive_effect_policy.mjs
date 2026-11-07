const nonempty = (value) => typeof value === "string" && value.trim().length > 0;
const key = (line) => JSON.stringify([line.ownerId, line.text]);
const scopes = (rule) => rule.weaponSets ?? [1, 2];
const knownKeys = (value, names) => value !== null && typeof value === "object" && !Array.isArray(value)
  && Object.keys(value).every((name) => names.includes(name));

export function parsePassiveEffectPolicy(input) {
  if (input === undefined) return { allowedPassiveEffectLosses: [] };
  if (!knownKeys(input, ["allowedPassiveEffectLosses"]) || !Array.isArray(input.allowedPassiveEffectLosses)) {
    throw new Error("effectCoverage requires allowedPassiveEffectLosses and no unknown fields.");
  }
  const allowed = input.allowedPassiveEffectLosses.map((rule) => {
    if (!knownKeys(rule, ["nodeId", "text", "reason", "weaponSets"]) || ![rule.nodeId, rule.text, rule.reason].every(nonempty)
      || rule.nodeId !== rule.nodeId.trim() || rule.nodeId === "*" || rule.text === "*") {
      throw new Error("A passive-effect exception requires an exact nodeId, text, and nonempty reason.");
    }
    if (Object.hasOwn(rule, "weaponSets") && (!Array.isArray(rule.weaponSets) || !rule.weaponSets.length
      || rule.weaponSets.some((set) => set !== 1 && set !== 2) || new Set(rule.weaponSets).size !== rule.weaponSets.length)) {
      throw new Error("Passive-effect exception weaponSets must contain distinct 1/2 numbers.");
    }
    return { nodeId: rule.nodeId, text: rule.text, reason: rule.reason.trim(), ...(rule.weaponSets ? { weaponSets: [...rule.weaponSets] } : {}) };
  });
  for (let i = 0; i < allowed.length; i++) for (let j = 0; j < i; j++) {
    if (allowed[i].nodeId === allowed[j].nodeId && allowed[i].text === allowed[j].text
      && scopes(allowed[i]).some((set) => scopes(allowed[j]).includes(set))) {
      throw new Error("Passive-effect exceptions must not duplicate or overlap weapon-set scopes.");
    }
  }
  return { allowedPassiveEffectLosses: allowed };
}

// The caller must validate complete native coverage before applying this policy.
export function collectProtectedPassiveEffects(result, policy) {
  const scenarios = result.weaponSetResults ?? { [String(result.originalActiveWeaponSet ?? 1)]: result };
  const baselines = new Map();
  for (const [set, scenario] of Object.entries(scenarios)) {
    const lines = scenario.candidates.find((entry) => entry.label === "Original").effectCoverage.lines.filter((line) => line.kind === "passive");
    const protectedKeys = new Set(lines.filter((line) => line.parseStatus !== "parsed").map(key));
    const effects = new Map();
    // Preserve multiplicity, including parsed copies when an identical line also has a parser gap.
    for (const line of lines) if (protectedKeys.has(key(line))) {
      const effect = effects.get(key(line)) ?? { nodeId: line.ownerId, nodeName: line.ownerName, text: line.text, originalOccurrences: 0 };
      effect.originalOccurrences++;
      effects.set(key(line), effect);
    }
    baselines.set(Number(set), effects);
  }
  for (const rule of policy.allowedPassiveEffectLosses) {
    const matches = [...baselines].filter(([set, effects]) => scopes(rule).includes(set) && effects.has(JSON.stringify([rule.nodeId, rule.text])));
    if (!matches.length || rule.weaponSets?.some((set) => !matches.some(([matchedSet]) => matchedSet === set))) {
      throw new Error(`Passive-effect exception is stale or does not match an original unmodeled effect in its requested sets: ${rule.nodeId}, "${rule.text}".`);
    }
  }
  return [...baselines].flatMap(([set, effects]) => [...effects.values()].map((effect) => {
    const rule = policy.allowedPassiveEffectLosses.find((rule) => rule.nodeId === effect.nodeId && rule.text === effect.text && scopes(rule).includes(set));
    return { ...effect, weaponSet: set, lossAllowed: rule !== undefined, ...(rule ? { reason: rule.reason } : {}) };
  }));
}

export function evaluatePassiveEffectPolicy(audit, result, policy) {
  const scenarios = result.weaponSetResults ?? { [String(result.originalActiveWeaponSet ?? 1)]: result };
  const protectedEffects = collectProtectedPassiveEffects(result, policy);
  return audit.candidates.map((candidate) => ({ label: candidate.label,
    effects: Object.entries(scenarios).flatMap(([set, scenario]) => {
      const lines = scenario.candidates.find((entry) => entry.label === candidate.label).effectCoverage.lines.filter((line) => line.kind === "passive");
      const retained = new Map();
      for (const line of lines) retained.set(key(line), (retained.get(key(line)) ?? 0) + 1);
      return protectedEffects.filter((effect) => effect.weaponSet === Number(set)).map(({ lossAllowed, reason, ...effect }) => {
        const identity = JSON.stringify([effect.nodeId, effect.text]);
        const retainedOccurrences = retained.get(identity) ?? 0;
        const lostOccurrences = Math.max(0, effect.originalOccurrences - retainedOccurrences);
        return { ...effect, retainedOccurrences, lostOccurrences, allowedLoss: lostOccurrences > 0 && lossAllowed,
          ...(lostOccurrences > 0 && lossAllowed ? { reason } : {}), passed: lostOccurrences === 0 || lossAllowed };
      });
    }),
  }));
}
