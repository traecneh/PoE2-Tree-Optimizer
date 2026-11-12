import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function validationSteps(mode) {
  if (mode !== "quick" && mode !== "release") throw new Error("Usage: npm run validate:quick | validate:release");
  const preferenceFiles = ["src/tree/passivePreferences.test.ts", "src/tree/passiveRecoveryPreferences.test.ts", "src/tree/passiveRecoupFlaskPreferences.test.ts", "src/tree/passiveUtilityRecoveryPreferences.test.ts", "src/tree/passiveCombatPreferences.test.ts", "src/tree/passiveElementalAilmentPreferences.test.ts", "src/tree/skillPreferencePresets.test.ts", "src/tree/skillSupportPreferences.test.ts",
    "src/tree/passiveWarcryPreferences.test.ts",
    "src/tree/passiveIncomingAilmentPreferences.test.ts",
    "src/tree/passiveGenericAilmentControlPreferences.test.ts",
    "src/tree/passiveCharmPreferences.test.ts",
    "src/tree/passiveAreaAttackCriticalPreferences.test.ts",
    "src/tree/passiveWeaponAccuracyCriticalPreferences.test.ts",
    "src/tree/passiveScopedBuildupPreferences.test.ts",
    "src/tree/passiveTwoHandedPreferences.test.ts",
    "src/tree/passiveOneHandedPreferences.test.ts",
    "src/tree/passiveOneHandedCriticalAilmentPreferences.test.ts",
    "src/tree/passiveBlindHinderPreferences.test.ts",
    "src/tree/passiveKnockbackMaimIncisionPreferences.test.ts",
    "src/tree/passiveMarkExposurePreferences.test.ts",
    "src/tree/markSkillPresets.test.ts",
    "src/tree/warcrySkillPresets.test.ts",
    "src/tree/attackSkillPreferencePresets.test.ts",
    "src/tree/remainingAttackSkillPreferencePresets.test.ts",
    "src/tree/maceSkillPreferencePresets.test.ts",
    "src/tree/quarterstaffSkillPreferencePresets.test.ts",
    "src/tree/bowPrimarySkillPreferencePresets.test.ts",
    "src/tree/spearPrimarySkillPreferencePresets.test.ts",
    "src/tree/monkPrimarySkillPreferencePresets.test.ts",
    "src/tree/maceShieldSkillPreferencePresets.test.ts",
    "src/tree/attackClosureSkillPreferencePresets.test.ts",
    "src/tree/spellUtilitySkillPreferencePresets.test.ts",
    "src/tree/proxySkillPreferencePresets.test.ts",
    "src/tree/defensiveBuffSkillPreferencePresets.test.ts",
    "src/tree/persistentOffenceSkillPreferencePresets.test.ts",
    "src/tree/resourceChargeSkillPreferencePresets.test.ts",
    "src/tree/utilityTriggerSkillPreferencePresets.test.ts",
    "src/tree/commonSupportBatch.test.ts",
    "src/tree/deploymentSupportBatch.test.ts",
    "src/tree/proxyDebuffSupportBatch.test.ts",
    "src/tree/elementalSupportBatch.test.ts",
    "src/tree/physicalSupportBatch.test.ts",
    "src/tree/resourceSupportBatch.test.ts",
    "src/tree/specialistSupportBatch.test.ts",
    "src/viewer/SpecialistSupportBatchControls.test.tsx",
    "src/viewer/SkillSupportControls.test.tsx",
    "src/viewer/SkillFocusPicker.test.tsx",
    "src/viewer/PassiveEffectPicker.test.tsx",
    "src/viewer/ControlTooltip.test.tsx",
    "src/viewer/ResourceSupportBatchControls.test.tsx",
    "src/viewer/PhysicalSupportBatchControls.test.tsx",
    "src/viewer/ElementalSupportBatchControls.test.tsx",
    "src/viewer/ProxyDebuffSupportBatchControls.test.tsx",
    "src/viewer/DeploymentSupportBatchControls.test.tsx",
    "src/viewer/CommonSupportBatchControls.test.tsx",
    "src/viewer/UtilityTriggerPresetControls.test.tsx",
    "src/tree/ballistaSkillPreferencePresets.test.ts",
    "src/tree/mortarCannonPreferences.test.ts",
    "src/tree/fireLightningSkillPreferencePresets.test.ts",
    "src/tree/plantSkillPreferencePresets.test.ts",
    "src/tree/plantSkillSupports.test.ts",
    "src/tree/plantCastingSupports.test.ts",
    "src/tree/plantCritEchoSupports.test.ts",
    "src/tree/plantBowSkillPreferencePresets.test.ts",
    "src/tree/plantBowSupports.test.ts",
    "src/tree/plantBowSpeedSupports.test.ts",
    "src/tree/plantBowTradeoffSupports.test.ts",
    "src/tree/poisonBowSkillPreferencePresets.test.ts",
    "src/tree/poisonBowSupports.test.ts",
    "src/tree/poisonBowSpeedSupports.test.ts",
    "src/tree/poisonBowDeadlySupports.test.ts",
    "src/tree/poisonBowConcentratedSupports.test.ts",
    "src/tree/poisonBowMovementSupports.test.ts",
    "src/tree/poisonBowEscalatingSupport.test.ts",
    "src/tree/poisonBowBurstingPlagueSupport.test.ts",
    "src/tree/poisonBowPoisonSupports.test.ts",
    "src/tree/poisonBowAdmixtureSupport.test.ts",
    "src/tree/poisonBowBleedSupports.test.ts",
    "src/tree/poisonBowCorrosionSupport.test.ts",
    "src/tree/poisonBowSwiftAfflictionSupports.test.ts",
    "src/tree/poisonBowCompressedDurationSupports.test.ts",
    "src/tree/poisonBowCullingStrikeSupports.test.ts",
    "src/tree/poisonBowBlindSupports.test.ts",
    "src/tree/poisonBowBlindsideSupport.test.ts",
    "src/tree/poisonBowBountySupports.test.ts",
    "src/tree/poisonBowMaimSupport.test.ts",
    "src/tree/poisonBowMaladySupport.test.ts",
    "src/tree/poisonBowHeftSupport.test.ts",
    "src/tree/poisonBowLongshotSupports.test.ts",
    "src/tree/poisonBowCloseCombatSupports.test.ts",
    "src/tree/poisonBowExecuteSupports.test.ts",
    "src/tree/poisonBowExecuteThreeSupport.test.ts",
    "src/tree/poisonBowExploitWeaknessSupport.test.ts",
    "src/tree/poisonBowChaosMasterySupport.test.ts",
    "src/tree/poisonBowChaosAttunementSupport.test.ts",
    "src/tree/poisonBowWitheringTouchSupport.test.ts",
    "src/tree/poisonBowPierceSupports.test.ts",
    "src/tree/poisonBowForkSupport.test.ts",
    "src/tree/poisonBowChainSupports.test.ts",
    "src/tree/poisonBowMultishotSupports.test.ts",
    "src/tree/poisonBowNovaSupports.test.ts",
    "src/tree/poisonBowRicochetSupports.test.ts",
    "src/tree/poisonBowSalvoSupport.test.ts",
    "src/tree/poisonBowMomentumSupport.test.ts",
    "src/tree/poisonBowOverabundanceSupports.test.ts",
    "src/tree/poisonBowSupercriticalSupport.test.ts",
    "src/tree/poisonBowInexorableSupports.test.ts",
    "src/tree/poisonBowPinpointSupport.test.ts",
    "src/tree/poisonBowAmbushSupport.test.ts",
    "src/tree/poisonBowLifeLeechSupports.test.ts",
    "src/tree/poisonBowManaLeechSupport.test.ts",
    "src/tree/poisonBowStunSupports.test.ts",
    "src/tree/poisonBowPinSupports.test.ts",
    "src/tree/poisonBowDrainSupports.test.ts",
    "src/tree/poisonBowArmourBreakSupports.test.ts",
    "src/tree/poisonBowArmourDemolisherSupports.test.ts",
    "src/tree/poisonBowArmourExplosionSupport.test.ts",
    "src/tree/poisonBowBleedAggravationSupports.test.ts",
    "src/tree/poisonBowDeepCutsSupports.test.ts",
    "src/tree/poisonBowBrutalitySupports.test.ts",
    "src/app/useBuildGoalsState.test.ts",
    "src/viewer/BuildGoalsPanel.test.tsx",
    "src/viewer/ProxySkillPreferenceControls.test.tsx",
    "src/viewer/ResourceChargePresetControls.test.tsx", "src/viewer/PersistentOffencePresetControls.test.tsx", "src/viewer/DefensiveBuffPresetControls.test.tsx",
    "src/tree/chaosPhysicalSkillPresets.test.ts", "src/tree/minionSkillPresets.test.ts", "src/tree/passiveMinionPreferences.test.ts", "src/tree/passiveMinionDefencePreferences.test.ts", "src/tree/passiveMinionUtilityPreferences.test.ts", "src/tree/passiveCompanionPreferences.test.ts", "src/tree/passiveScopedDamagePreferences.test.ts", "src/tree/weightedBuildGoalsOptimizer.test.ts", "src/tree/savedBuilds.test.ts", "src/tree/savedBuildTransfer.test.ts",
    "src/tree/passiveTotemPreferences.test.ts", "src/tree/passiveTotemDefencePreferences.test.ts", "src/tree/passiveGenericDamageSpeedChillPreferences.test.ts", "src/tree/passiveAilmentChancePreferences.test.ts", "src/tree/passiveAilmentBuildupDurationPreferences.test.ts", "src/tree/passiveIncomingDebuffPreferences.test.ts", "src/tree/passivePlayerResistancePreferences.test.ts", "src/tree/passiveArmourBreakPreferences.test.ts", "src/tree/passiveSustainExpiryPreferences.test.ts", "src/tree/passiveRecoupKillFlaskDurationPreferences.test.ts", "src/viewer/PassivePreferenceControls.test.tsx", "src/viewer/SkillPreferencePresetControls.test.tsx", "tools/coverage", "tools/validation", "scripts/prepare-data.test.mjs"];
  return [
    { name: "Prepare graph", args: ["scripts/prepare-data.mjs", "--graph-only"] },
    { name: mode === "quick" ? "Preference/tooling tests" : "Full test suite", args: ["node_modules/vitest/vitest.mjs", "run", ...(mode === "quick" ? preferenceFiles : [])] },
    { name: "Typecheck", args: ["node_modules/typescript/bin/tsc", "-b", "--pretty", "false"] },
    ...(mode === "release" ? [
      { name: "Prepare images", args: ["scripts/prepare-data.mjs"] },
      { name: "Production build", args: ["node_modules/vite/bin/vite.js", "build"] },
      { name: "Graph validation", args: ["--import", "tsx", "src/extract/cli.ts", "validate", "--graph", "data/tree-graph.json"] },
    ] : []),
    { name: "Coverage baseline", args: ["--import", "tsx", "tools/coverage/cli.ts", "check"] },
  ];
}

export async function runValidation(mode, { root = resolve(dirname(fileURLToPath(import.meta.url)), "../.."), runStep } = {}) {
  const steps = validationSteps(mode);
  const results = [];
  let child;
  let cancelled = false;
  const stop = () => { cancelled = true; child?.kill(); };
  const execute = runStep ?? ((args) => new Promise((done, reject) => {
    child = spawn(process.execPath, args, { cwd: root, stdio: "inherit", windowsHide: true });
    child.once("error", reject);
    child.once("close", (code) => { child = undefined; done(code ?? 1); });
  }));
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  let exitCode = 0;
  try {
    for (const step of steps) {
      if (cancelled) { exitCode = 130; break; }
      console.log(`\n[${mode}] ${step.name}`);
      const started = performance.now();
      let code;
      try { code = await execute(step.args); }
      catch (error) { console.error(error.message); code = 1; }
      results.push({ name: step.name, exitCode: code, milliseconds: Math.round(performance.now() - started) });
      if (code !== 0 || cancelled) { exitCode = cancelled ? 130 : code; break; }
    }
  } finally {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
    const output = join(root, "var/validation");
    mkdirSync(output, { recursive: true });
    writeFileSync(join(output, `${mode}.json`), `${JSON.stringify({ mode, passed: exitCode === 0, exitCode, results,
      skipped: steps.slice(results.length).map((s) => s.name) }, null, 2)}\n`);
  }
  console.log(`\n${mode} validation ${exitCode === 0 ? "passed" : "failed"}; ${results.reduce((n, r) => n + r.milliseconds, 0)} ms. Details: var/validation/${mode}.json`);
  return exitCode;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw new Error("Usage: run.mjs quick|release");
    process.exitCode = await runValidation(process.argv[2]);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
