// Minimal native-record stand-in for policy tests. Real collection is exercised by the Lua driver.
export function attachFixtureCoverage({ audit, result }) {
  const scenarios = result.weaponSetResults ?? { [String(result.originalActiveWeaponSet ?? 1)]: result };
  for (const [set, scenario] of Object.entries(scenarios)) {
    scenario.engineVersion ??= "fixture";
    scenario.treeVersion ??= "fixture";
    scenario.activeWeaponSet = Number(set);
    for (const candidate of audit.candidates) {
      const entry = scenario.candidates.find((entry) => entry.label === candidate.label);
      if (!entry) continue;
      entry.effectCoverage = { version: 1, sourceXmlSha256: audit.sourceXmlSha256, engineVersion: scenario.engineVersion,
        treeVersion: scenario.treeVersion, candidateLabel: candidate.label, weaponSet: Number(set), customLineCount: 0,
        lines: [], items: [], grants: [],
        nodes: [...new Set([...candidate.nodeIds, ...(audit.preservedAscendancyNodeIds ?? []), ...(audit.preservedWeaponSets?.[set] ?? [])])]
          .map((id) => ({ id, name: id, granted: false, paid: id !== candidate.nodeIds[0], descriptionLineCount: 0 })) };
    }
  }
}
