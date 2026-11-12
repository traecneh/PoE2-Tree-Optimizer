import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { utilityTriggerFixtures as fixtures, utilityTriggerNativeObservations, utilityTriggerSecondaryObservations, utilityTriggerRecipientFixtures } from "./utilityTriggerSkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset, resolveSkillPreferencePreset } from "./skillPreferencePresets";
import { utilityTriggerSocketChoices } from "./utilityTriggerSkillPreferencePresets";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSocketedProxySkillId } from "./proxySkillPreferencePresets";
import { setSkillSupport, applySkillSupportPriorities } from "./skillSupportPreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import { runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import type { TreeGraph, TreeNode } from "./types";

const preset = (id: string) => getSkillPreferencePreset(id)!;
const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const duration = ["prolonged-duration-i","prolonged-duration-ii"], cost = ["efficiency-i","efficiency-ii"], area = ["magnified-area-i","magnified-area-ii"];
const supports: Record<string,string[]> = { blasphemy: area, "lingering-illusion": [...duration,...cost],
  "arctic-howl": [...area,...duration,...cost,"mobility","concentrated-area"], "lunar-blessing": [...area,...duration,...cost,"concentrated-area"] };
type Observation = { id: string; child: boolean; support: string; extra?: string; socket?: string; recipient?: string; disabled: boolean;
  output: Record<string,number | string | string[]>; minion: boolean };
const native = [...utilityTriggerNativeObservations,...utilityTriggerSecondaryObservations] as unknown as Observation[];
const observed = (id: string, criteria: Partial<Observation> = {}) => native.find(n => n.id === fixtures.find(f => f.id === id)!.effectId
  && Object.entries({ support: "base",disabled: false,...criteria }).every(([k,v]) => n[k as keyof Observation] === v))!;
const metric = (o: Observation, key: string) => o.output[key] as number;
const contexts = Object.entries(utilityTriggerSocketChoices).flatMap(([focusSkillId,ids]) => ids.map(socketedProxySkillId => ({ focusSkillId,socketedProxySkillId })));

describe("final fourteen positive-tier utility and trigger focuses", () => {
  it.each(fixtures)("keeps $name's independent identity and legal common-support subset", f => {
    const p = preset(f.id);
    expect(p).toMatchObject({ name: f.name, gemId: f.gemId, tags: [...f.tags] });
    const links = preCommon45SupportsFor(f.id), legal = new Set<string>([...f.legal,...f.children.flatMap(c => c.legal)]);
    expect(links.map(s => s.id).sort()).toEqual([...(supports[f.id] ?? [])].sort());
    for (const link of links) {
      expect(legal.has(link.effectId),f.id + "/" + link.effectId).toBe(true);
      const current = addSkillPresetPreferences({ mode: "weighted",extraPointBudget: 5,preferences: [] },p);
      const selected = setSkillSupport(current,link.id,true);
      expect(selected.preferences).toEqual(current.preferences);
      expect(applySkillSupportPriorities(selected,p).preferences).toEqual(current.preferences);
    }
  });

  it("adds exactly 21 common pairs without claiming complete support or DPS simulation", () => {
    expect(fixtures.reduce((sum,f) => sum + preCommon45SupportsFor(f.id).length,0)).toBe(21);
    expect(getSkillPreferencePreset("made-up-meta")).toBeUndefined();
  });

  it.each(contexts)("validates $focusSkillId/$socketedProxySkillId against independent native linkage", ctx => {
    const parent = fixtures.find(f => f.id === ctx.focusSkillId)!;
    const recipient = utilityTriggerRecipientFixtures.find(f => f.name === preset(ctx.socketedProxySkillId).name)!;
    expect(recipient).toBeDefined();
    expect(recipient.metaCompatibility.find(c => c.parent === parent.effectId)?.legal).toBe(true);
    expect(normalizeSocketedProxySkillId(ctx.focusSkillId,ctx.socketedProxySkillId)).toBe(ctx.socketedProxySkillId);
    const resolved = resolveSkillPreferencePreset(ctx)!;
    const ids = resolved.suggestions.map(e => e.id);
    expect(ids).not.toContain("castSpeed");
    expect(ids).not.toContain("minionDamage");
    expect(ids).not.toContain("totemDamage");
    expect(resolved.passiveStatScopes).not.toContain("spellHinderChance");
    expect(resolved.passiveStatScopes).not.toContain("attackBlindChance");
    expect(ids).toHaveLength(new Set(ids).size);
    expect(normalizePassiveOptimizationSettings({ mode: "weighted",extraPointBudget: 4,preferences: [],...ctx })).toMatchObject(ctx);
  });

  it.each(fixtures)("preserves $name, explicit recipient and priorities through save/export", f => {
    const socketedProxySkillId = utilityTriggerSocketChoices[f.id]?.[0];
    const current: PassiveOptimizationSettings = { mode: "weighted",extraPointBudget: 8,pointBudgetMode: "all-available",focusSkillId: f.id,
      preferences: [{ id: "energyShield",weight: 1 }], ...(socketedProxySkillId ? { socketedProxySkillId } : {}) };
    const selected = addSkillPresetPreferences(current,resolveSkillPreferencePreset(current)!);
    expect(selected.preferences[0]).toEqual(current.preferences[0]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    const [saved] = normalizeSavedBuilds([{ id: "utilities",name: f.name,createdAt: "test",updatedAt: "test",state: {
      selectedClassStartId: "witch",pathStartNodeId: "start",nodeVisualScale: 3,buildGoalNodeIds: ["goal"],ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main",weaponSetAllocationNodeIds: { 1: ["weapon-a"],2: ["weapon-b"] },optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"],committedEdgeKeys: [],previewNodePath: [],previewEdgeKeys: [],previewRouteNodePath: [] },
    } }]);
    expect(saved.state.optimizerSettings).toEqual(selected);
    expect(saved.state.weaponSetAllocationNodeIds).toEqual({ 1: ["weapon-a"],2: ["weapon-b"] });
    expect(saved.state.buildGoalNodeIds).toEqual(["goal"]);
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
  });

  it.each([
    ["metaEnergyGain","Meta Skills gain 10% increased Energy","Meta Skills gain 10% reduced Energy"],
    ["minionRevivalSpeed","Minions Revive 10% faster","Minions Revive 10% slower"],
  ] as const)("keeps %s signed and opt-in without multiplying a supply rate", (id,plus,minus) => {
    expect(passivePreferenceValues(node(plus))).toEqual({ [id]: 10 });
    expect(passivePreferenceValues(node(minus))).toEqual({ [id]: -10 });
    expect(passivePreferenceValues(node(plus,minus))).toEqual({ [id]: 0 });
    expect(scorePassiveNode(node(plus),[{ id,weight: 2 }])).toBe(2);
    expect(scorePassiveNode(node(minus),[{ id,weight: 2 }])).toBe(-2);
    expect(scorePassiveNode(node(plus),[])).toBe(0);
  });

  it("rejects conditional, borrowed, cap/cost and revival-ownership near misses", () => {
    for (const text of ["Meta Skills gain 20% increased Energy if you've Critically Hit Recently","Minions Revive 35% faster if all your Minions are Companions",
      "Meta Skills have 20% increased maximum Energy","Meta Skills spend 20% reduced Energy","Allies' Meta Skills gain 20% increased Energy",
      "20% increased Minion Revival Speed","You Revive 20% faster","Minions Revive -5% faster","Meta Skills gain NaN% increased Energy",
      "Meta Skills gain " + "9".repeat(400) + "% increased Energy"]) expect(passivePreferenceValues(node(text))).toEqual({});
    for (const id of Object.keys(utilityTriggerSocketChoices)) {
      expect(normalizeSocketedProxySkillId(id,"raise-zombie")).toBeUndefined();
      expect(normalizeSocketedProxySkillId(id,"__proto__")).toBeUndefined();
    }
  });

  it("scores Triggered Spell Damage once only for explicit reviewed damaging spell recipients", () => {
    const line = node("Triggered Spells deal 20% increased Spell Damage","10% increased Spell Damage");
    for (const socketedProxySkillId of ["fireball","arc","contagion","tornado"]) {
      const ctx = { focusSkillId: "cast-on-critical",socketedProxySkillId };
      expect(passivePreferenceValues(line,ctx)).toEqual({ spellDamage: 30 });
      expect(passivePreferenceValues(node("Triggered Spells deal 10% reduced Spell Damage"),ctx)).toEqual({ spellDamage: -10 });
      expect(scorePassiveNode(line,[{ id: "spellDamage",weight: 2 }],ctx)).toBe(6);
    }
    for (const ctx of [{}, { focusSkillId: "fireball" },{ focusSkillId: "cast-on-critical" },
      { focusSkillId: "blasphemy",socketedProxySkillId: "enfeeble" },{ focusSkillId: "feral-invocation",socketedProxySkillId: "maul" }]) {
      expect(passivePreferenceValues(node("Triggered Spells deal 20% increased Spell Damage"),ctx)).toEqual({});
    }
    expect(passivePreferenceValues(node("Triggered Spells deal 20% increased Spell Damage while on Full Life"),
      { focusSkillId: "cast-on-critical",socketedProxySkillId: "fireball" })).toEqual({});
  });

  it("keeps Blasphemy curse utility distinct from aura magnitude and self-cast timers", () => {
    const ctx = { focusSkillId: "blasphemy",socketedProxySkillId: "enfeeble" }, p = resolveSkillPreferencePreset(ctx)!;
    expect(p.suggestions.map(s => s.id)).toEqual(["curseMagnitude","curseArea","areaOfEffect"]);
    const base = observed("blasphemy",{ socket: "EnfeeblePlayer" });
    expect(metric(base,"SpiritReserved")).toBe(60);
    expect(metric(base,"CurseEffectMod")).toBe(.59);
    expect(metric(observed("blasphemy",{ socket: "EnfeeblePlayer",extra: "20% increased Curse Magnitudes" }),"CurseEffectMod")).toBeCloseTo(.59 * 1.2,10);
    expect(metric(observed("blasphemy",{ socket: "EnfeeblePlayer",extra: "Aura Skills have 20% increased Magnitudes" }),"CurseEffectMod")).toBe(.59);
    expect(metric(observed("blasphemy",{ socket: "EnfeeblePlayer",support: "SupportMagnifiedAreaPlayerTwo" }),"AreaOfEffectMod")).toBe(1.45);
  });

  it("does not confuse trigger cast speed or Meta Energy with per-hit damage or supplied events", () => {
    const base = observed("cast-on-critical",{ socket: "FireballPlayer" });
    expect(metric(base,"AverageHit")).toBe(299.6);
    expect(metric(observed("cast-on-critical",{ socket: "FireballPlayer",extra: "20% increased Cast Speed" }),"AverageHit")).toBe(299.6);
    expect(metric(observed("cast-on-critical",{ socket: "FireballPlayer",extra: "Meta Skills gain 20% increased Energy" }),"AverageHit")).toBe(299.6);
    expect(metric(observed("cast-on-critical",{ socket: "FireballPlayer",extra: "Triggered Spells deal 20% increased Spell Damage" }),"AverageHit")).toBeCloseTo(299.6*1.2,8);
    for (const socket of ["ContagionPlayer","TornadoPlayer"]) expect(metric(observed("cast-on-critical",{ socket,extra: "Triggered Spells deal 20% increased Spell Damage" }),"TotalDot"))
      .toBeCloseTo(metric(observed("cast-on-critical",{ socket }),"TotalDot")*1.2,8);
  });

  it("keeps Feral single attacks out of Minion, Totem and triggered-Spell damage", () => {
    const base = observed("feral-invocation",{ socket: "BearMaulPlayer" });
    expect(base.minion).toBe(false);
    for (const extra of ["Minions deal 30% increased Damage","30% increased Totem Damage","Triggered Spells deal 20% increased Spell Damage"]) {
      expect(metric(observed("feral-invocation",{ socket: "BearMaulPlayer",extra }),"hit")).toBe(metric(base,"hit"));
    }
    expect(metric(observed("feral-invocation",{ socket: "BearMaulPlayer",extra: "30% increased Attack Damage" }),"hit")).toBeCloseTo(metric(base,"hit")*1.3,8);
  });

  it("checks reciprocal Sacrifice revival and Blink cooldown behavior independently", () => {
    expect(metric(observed("sacrifice",{ recipient: "SummonSkeletalArsonistsPlayer",disabled: true }),"MinionRevivalSpeed")).toBe(12);
    expect(metric(observed("sacrifice",{ recipient: "SummonSkeletalArsonistsPlayer" }),"MinionRevivalSpeed")).toBe(12/.6);
    expect(metric(observed("sacrifice",{ recipient: "SummonSkeletalArsonistsPlayer",extra: "Minions Revive 25% faster" }),"MinionRevivalSpeed")).toBe(12/(.6*1.25));
    expect(metric(observed("blink",{ child: true,support: "SupportRapidCastingPlayerTwo" }),"Time")).toBe(metric(observed("blink",{ child: true }),"Time"));
    expect(metric(observed("blink",{ child: true,extra: "20% increased Cooldown Recovery Rate" }),"Cooldown")).toBeLessThan(metric(observed("blink",{ child: true }),"Cooldown"));
  });

  it("keeps Arctic Cold Warcry and Lunar parent/beam scopes separate", () => {
    expect(preset("arctic-howl").passiveStatScopes).toEqual(["secondaryAreaDamage"]);
    const arctic = observed("arctic-howl");
    for (const extra of ["30% increased Attack Damage","30% increased Spell Damage"]) expect(metric(observed("arctic-howl",{ extra }),"AverageHit")).toBe(metric(arctic,"AverageHit"));
    for (const extra of ["30% increased Area Damage","30% increased Cold Damage"]) expect(metric(observed("arctic-howl",{ extra }),"AverageHit")).toBeGreaterThan(metric(arctic,"AverageHit"));
    expect(passivePreferenceValues(node("20% increased Area Damage","20% increased Spell Area Damage","20% increased Attack Area Damage"),{ focusSkillId: "arctic-howl" })).toEqual({ areaDamage: 20 });
    expect(preset("lunar-blessing").passiveStatScopes).toEqual([]);
    expect(preset("lunar-blessing").suggestions.map(s => s.id)).not.toContain("coldDamage");
    expect(metric(observed("lunar-blessing",{ child: false,support: "SupportEfficiencyPlayerTwo" }),"ManaCost")).toBe(100);
    expect(metric(observed("lunar-blessing",{ child: false,support: "ProlongedDurationSupportPlayerTwo" }),"Duration")).toBe(6.765);
    expect(metric(observed("lunar-blessing",{ child: true,support: "SupportConcentratedAreaPlayer" }),"hit")).toBeGreaterThan(metric(observed("lunar-blessing",{ child: true }),"hit"));
    expect(metric(observed("lingering-illusion",{ child: true,support: "ProlongedDurationSupportPlayerTwo" }),"Duration")).toBe(4.059);
    expect(metric(observed("lingering-illusion",{ child: true,support: "SupportEfficiencyPlayerTwo" }),"ManaCost")).toBe(6);
  });

  it("recognizes only the eleven new unconditional main-tree wordings", () => {
    const graph = JSON.parse(readFileSync(new URL("../../data/tree-graph.json",import.meta.url),"utf8")) as TreeGraph;
    const count = { metaEnergyGain: 0,minionRevivalSpeed: 0,spellDamage: 0 }, wording = new Set<string>();
    for (const n of Object.values(graph.nodes)) if (!n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery) for (const line of n.stats) {
      const values = passivePreferenceValues(node(line),{ focusSkillId: "cast-on-critical",socketedProxySkillId: "fireball" });
      for (const key of ["metaEnergyGain","minionRevivalSpeed"] as const) if (Object.hasOwn(values,key)) { count[key]++;wording.add(line); }
      if (line.startsWith("Triggered Spells") && values.spellDamage) { count.spellDamage++;wording.add(line); }
    }
    expect(count).toEqual({ metaEnergyGain: 14,minionRevivalSpeed: 5,spellDamage: 8 });
    expect(wording.size).toBe(11);
  });

  it("routes a reviewed trigger benefit within budget without changing Shortest", () => {
    const graph: TreeGraph = { schemaVersion: 1,gameVersion: "test",extractedAt: "test",source: { kind: "fixture",path: "test" },
      nodes: Object.fromEntries(["start","plain","good","bridge","goal"].map(id => [id,{ ...node(...(id === "good" ? ["Triggered Spells deal 20% increased Spell Damage"] : [])),id,flags: id === "start" ? { classStart: true } : {} }])),
      edges: [["start","plain"],["plain","goal"],["start","good"],["good","bridge"],["bridge","goal"]].map(([from,to]) => ({ from,to })),
      groups: {},classStarts: { witch: "start" },bounds: { minX: 0,minY: 0,maxX: 100,maxY: 100 } };
    const request = { graph,mode: "weighted" as const,baseNodeIds: ["start"],baseEdgeKeys: [],goalNodeIds: ["goal"],extraPointBudget: 1,
      focusSkillId: "cast-on-critical",socketedProxySkillId: "fireball",preferences: [{ id: "spellDamage" as const,weight: 2 }] };
    const result = runOptimizerRequest(request,undefined,{ maxIterations: 8 });
    expect(result).toMatchObject({ status: "success",pointCost: 3,weighted: { score: 4 } });
    expect(result.totalNodeIds).toContain("good");
    const shortest = { ...request,mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
    expect(runOptimizerRequest(shortest).pointCost).toBe(2);
    expect(runOptimizerRequest({ ...request,socketedProxySkillId: undefined }).status).toBe("error");
  });
});
