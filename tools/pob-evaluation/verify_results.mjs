import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function checkCalculations(fixtures, results) {
  const checks = [];
  const cases = new Map((results.cases ?? []).map((entry) => [entry.id, entry.output]));
  const check = (name, actual, expected, tolerance = 1e-8) => {
    const passed = typeof expected === "number"
      ? Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected))
      : typeof expected === "boolean" && actual === expected;
    checks.push({ name, actual: actual ?? null, expected, passed });
  };
  const value = (id, stat) => cases.get(id)?.[stat];

  // Expected values come from the controlled modifier inputs, not PoB's power scores.
  check("+10 Strength", value("strength", "Str"), value("baseline", "Str") + 10);
  check("+10 Intelligence", value("intelligence", "Int"), value("baseline", "Int") + 10);
  check("100 flat ES", value("flat-es", "EnergyShield"), 100);
  check("100 ES with 20% increased", value("increased-es", "EnergyShield"), 100 * 1.2);
  check("20% and 30% increased ES add together", value("additive-es", "EnergyShield"), 100 * (1 + 0.2 + 0.3));
  check("30% more ES multiplies after increased ES", value("more-es", "EnergyShield"), 100 * 1.2 * 1.3);
  check("flat ES is combined before percentage scaling", value("flat-and-increased-es", "EnergyShield"), (100 + 100) * 1.2);
  check("two 50% attack-speed increases double speed", value("attack-speed", "Speed"), value("baseline", "Speed") * 2);
  check("attack-speed fixture doubles DPS", value("attack-speed", "CombinedDPS"), value("baseline", "CombinedDPS") * 2);
  const rangeDamage = cases.get("damage-ranges")?.damage;
  check("three Lightning ranges add their minimums", rangeDamage?.LightningMinBase, 1 + 1 + 1);
  check("three Lightning ranges add their maximums", rangeDamage?.LightningMaxBase, 7 + 7 + 37);
  const baseDamage = cases.get("baseline")?.damage;
  check("controlled unarmed minimum", baseDamage?.PhysicalMinBase, 2);
  check("controlled unarmed maximum", baseDamage?.PhysicalMaxBase, 5);
  const scaledDamage = cases.get("more-attack-damage")?.damage;
  check("20% more damage rounds the minimum component", scaledDamage?.PhysicalStoredHitMin, Math.round(2 * 1.2));
  check("20% more damage rounds the maximum component", scaledDamage?.PhysicalStoredHitMax, Math.round(5 * 1.2));
  check("DPS comparison accounts for rounded hit components", value("more-attack-damage", "CombinedDPS"),
    value("baseline", "CombinedDPS") * ((Math.round(2 * 1.2) + Math.round(5 * 1.2)) / (2 + 5)));

  for (const candidate of fixtures.candidates ?? []) {
    const actual = results.routes?.find((route) => route.label === candidate.label);
    const ids = new Set(candidate.nodeIds);
    check(`${candidate.label}: point count`, candidate.pointCost, ids.size - 1);
    check(`${candidate.label}: contains all required goals`, fixtures.goalNodeIds.every((id) => ids.has(id)), true);
    const adjacency = new Map([...ids].map((id) => [id, []]));
    let validEdges = true;
    for (const key of candidate.edgeKeys) {
      const [from, to, extra] = key.split("::");
      if (extra !== undefined || !ids.has(from) || !ids.has(to)) { validEdges = false; continue; }
      adjacency.get(from).push(to);
      adjacency.get(to).push(from);
    }
    const visited = new Set(ids.has(fixtures.baseNodeId) ? [fixtures.baseNodeId] : []);
    for (const id of visited) for (const next of adjacency.get(id) ?? []) visited.add(next);
    check(`${candidate.label}: complete connected route`, validEdges && visited.size === ids.size, true);

    let increasedES = 0;
    let flatES = 0;
    let strength = 0;
    let intelligence = 0;
    for (const node of candidate.nodes) {
      for (const stat of node.stats) {
        const increased = /^(\d+)% increased maximum Energy Shield$/.exec(stat);
        const flat = /^\+(\d+) to maximum Energy Shield$/.exec(stat);
        const str = /^\+(\d+) to Strength$/.exec(stat);
        const int = /^\+(\d+) to Intelligence$/.exec(stat);
        if (increased) increasedES += Number(increased[1]);
        if (flat) flatES += Number(flat[1]);
        if (str) strength += Number(str[1]);
        if (int) intelligence += Number(int[1]);
        if (stat === "+5 to any Attribute") strength += 5;
      }
    }
    check(`${candidate.label}: independently summed ES`, actual?.output.EnergyShield, Math.round((100 + flatES) * (1 + increasedES / 100)));
    check(`${candidate.label}: chosen Strength travel nodes`, actual?.output.Str, results.routeBaseline?.Str + strength);
    check(`${candidate.label}: Intelligence`, actual?.output.Int, results.routeBaseline?.Int + intelligence);
  }
  check("calculator leaves the original allocation unchanged", results.allocationUnchanged, true);
  for (const stat of ["Str", "Dex", "Int", "EnergyShield", "Life", "Mana", "CombinedDPS"]) {
    check(`baseline preserved after candidate calculations: ${stat}`, results.routeBaselineAfter?.[stat], results.routeBaseline?.[stat]);
  }
  return { passed: checks.every((check) => check.passed), checkCount: checks.length, checks };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [fixturePath, resultPath, reportPath] = process.argv.slice(2);
  if (!fixturePath || !resultPath || !reportPath) throw new Error("Usage: node verify_results.mjs FIXTURES.json RESULTS.json REPORT.json");
  const report = checkCalculations(JSON.parse(readFileSync(fixturePath, "utf8")), JSON.parse(readFileSync(resultPath, "utf8")));
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  for (const check of report.checks.filter((check) => !check.passed)) console.error(JSON.stringify(check));
  console.log(`${report.checks.filter((check) => check.passed).length}/${report.checkCount} independent checks passed.`);
  if (!report.passed) process.exitCode = 1;
}
