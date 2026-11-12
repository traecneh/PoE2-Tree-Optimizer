import { openPicker, selectPickerOption } from "../testUtils/selectPickerOption";
import { commonSupportFixtures } from "../tree/commonSupportBatch.fixtures";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PassiveOptimizationSettings } from "../tree/passivePreferences";
import { getSkillPreferencePreset } from "../tree/skillPreferencePresets";
import { plantBowSupportCompatibility, plantBowSupportFixtures } from "../tree/plantBowSupports.fixtures";
import { plantBowSpeedSupportFixtures } from "../tree/plantBowSpeedSupports.fixtures";
import { plantBowTradeoffSupports } from "../tree/plantBowTradeoffSupports.fixtures";
import { poisonBowSupportFixtures } from "../tree/poisonBowSupports.fixtures";
import { poisonBowSpeedSupportFixtures, poisonBowReviewedSupportIds, poisonBowReviewedSupportIdsFor } from "../tree/poisonBowSpeedSupports.fixtures";
import { poisonBowDeadlySupportFixtures } from "../tree/poisonBowDeadlySupports.fixtures";
import { poisonBowConcentratedSupportFixture } from "../tree/poisonBowConcentratedSupports.fixtures";
import { poisonBowMovementSupportFixtures } from "../tree/poisonBowMovementSupports.fixtures";
import { poisonBowEscalatingSupportFixture } from "../tree/poisonBowEscalatingSupport.fixtures";
import { poisonBowBurstingPlagueSupportFixture } from "../tree/poisonBowBurstingPlagueSupport.fixtures";
import { poisonBowPoisonSupportFixtures } from "../tree/poisonBowPoisonSupports.fixtures";
import { poisonBowAdmixtureSupportFixture } from "../tree/poisonBowAdmixtureSupport.fixtures";
import { poisonBowBleedSupportFixtures } from "../tree/poisonBowBleedSupports.fixtures";
import { poisonBowCorrosionSupportFixture } from "../tree/poisonBowCorrosionSupport.fixtures";
import { poisonBowSwiftSupportFixtures } from "../tree/poisonBowSwiftAfflictionSupports.fixtures";
import { poisonBowCompressedSupportFixtures } from "../tree/poisonBowCompressedDurationSupports.fixtures";
import { poisonBowCullingSupportFixtures } from "../tree/poisonBowCullingStrikeSupports.fixtures";
import { poisonBowBlindSupportFixtures } from "../tree/poisonBowBlindSupports.fixtures";
import { poisonBowBlindsideSupportFixture } from "../tree/poisonBowBlindsideSupport.fixtures";
import { poisonBowBountySupportFixtures } from "../tree/poisonBowBountySupports.fixtures";
import { poisonBowMaimSupportFixture } from "../tree/poisonBowMaimSupport.fixtures";
import { poisonBowMaladySupportFixture } from "../tree/poisonBowMaladySupport.fixtures";
import { poisonBowHeftSupportFixture } from "../tree/poisonBowHeftSupport.fixtures";
import { poisonBowLongshotSupportFixtures } from "../tree/poisonBowLongshotSupports.fixtures";
import { poisonBowCloseCombatSupportFixtures } from "../tree/poisonBowCloseCombatSupports.fixtures";
import { poisonBowExecuteSupportFixtures } from "../tree/poisonBowExecuteSupports.fixtures";
import { poisonBowExecuteThreeSupportFixture } from "../tree/poisonBowExecuteThreeSupport.fixtures";
import { poisonBowExploitWeaknessSupportFixture } from "../tree/poisonBowExploitWeaknessSupport.fixtures";
import { poisonBowChaosMasterySupportFixture } from "../tree/poisonBowChaosMasterySupport.fixtures";
import { poisonBowChaosAttunementSupportFixture } from "../tree/poisonBowChaosAttunementSupport.fixtures";
import { poisonBowWitheringTouchSupportFixture } from "../tree/poisonBowWitheringTouchSupport.fixtures";
import { poisonBowPierceSupportFixtures } from "../tree/poisonBowPierceSupports.fixtures";
import { poisonBowForkSupportFixture } from "../tree/poisonBowForkSupport.fixtures";
import { poisonBowChainSupportFixtures } from "../tree/poisonBowChainSupports.fixtures";
import { poisonBowMultishotSupportFixtures } from "../tree/poisonBowMultishotSupports.fixtures";
import { poisonBowNovaSupportFixtures } from "../tree/poisonBowNovaSupports.fixtures";
import { poisonBowRicochetSupportFixtures } from "../tree/poisonBowRicochetSupports.fixtures";
import { poisonBowSalvoSupportFixture } from "../tree/poisonBowSalvoSupport.fixtures";
import { poisonBowMomentumSupportFixture } from "../tree/poisonBowMomentumSupport.fixtures";
import { poisonBowOverabundanceSupportFixtures } from "../tree/poisonBowOverabundanceSupports.fixtures";
import { poisonBowSupercriticalSupportFixture } from "../tree/poisonBowSupercriticalSupport.fixtures";
import { poisonBowInexorableSupportFixtures } from "../tree/poisonBowInexorableSupports.fixtures";
import { poisonBowPinpointSupportFixture } from "../tree/poisonBowPinpointSupport.fixtures";
import { poisonBowAmbushSupportFixture } from "../tree/poisonBowAmbushSupport.fixtures";
import { poisonBowLifeLeechSupportFixtures } from "../tree/poisonBowLifeLeechSupports.fixtures";
import { poisonBowManaLeechSupportFixture } from "../tree/poisonBowManaLeechSupport.fixtures";
import { poisonBowStunSupportFixtures } from "../tree/poisonBowStunSupports.fixtures";
import { poisonBowPinSupportFixtures } from "../tree/poisonBowPinSupports.fixtures";
import { poisonBowDrainSupportFixtures } from "../tree/poisonBowDrainSupports.fixtures";
import { poisonBowArmourBreakSupportFixtures } from "../tree/poisonBowArmourBreakSupports.fixtures";
import { poisonBowArmourDemolisherSupportFixtures } from "../tree/poisonBowArmourDemolisherSupports.fixtures";
import { poisonBowArmourExplosionSupportFixture } from "../tree/poisonBowArmourExplosionSupport.fixtures";
import { poisonBowBleedAggravationSupports } from "../tree/poisonBowBleedAggravationSupports.fixtures";
import { poisonBowDeepCutsSupports } from "../tree/poisonBowDeepCutsSupports.fixtures";
import { poisonBowBrutalitySupports } from "../tree/poisonBowBrutalitySupports.fixtures";
import { macePrimaryFixtures } from "../tree/macePrimarySkills.fixtures";
import { quarterstaffPrimaryFixtures } from "../tree/quarterstaffPrimarySkills.fixtures";
import { bowPrimaryFixtures } from "../tree/bowPrimarySkills.fixtures";
import { spearPrimaryFixtures } from "../tree/spearPrimarySkills.fixtures";
import { monkPrimaryFixtures } from "../tree/monkPrimarySkills.fixtures";
import { maceShieldFixtures } from "../tree/maceShieldSkills.fixtures";
import { attackClosureFixtures } from "../tree/attackClosureSkills.fixtures";
import { spellUtilityFixtures } from "../tree/spellUtilitySkills.fixtures";
import { SkillPreferencePresetControls } from "./SkillPreferencePresetControls";

import { deploymentSupportFixtures } from "../tree/deploymentSupportBatch.fixtures";
import { proxyDebuffSupportFixtures } from "../tree/proxyDebuffSupportBatch.fixtures";
import { elementalSupportFixtures } from "../tree/elementalSupportBatch.fixtures";
import { physicalSupportFixtures } from "../tree/physicalSupportBatch.fixtures";
import { resourceSupportFixtures } from "../tree/resourceSupportBatch.fixtures";
import { specialistSupportFixtures } from "../tree/specialistSupportBatch.fixtures";
// Keep historical capture counts pinned; later batches have independent DOM tests.
const laterSupportFixtures = [...commonSupportFixtures,...deploymentSupportFixtures,...proxyDebuffSupportFixtures,...elementalSupportFixtures,...physicalSupportFixtures,...resourceSupportFixtures,...specialistSupportFixtures];
const commonSupportLabels = new Set(laterSupportFixtures.map(f=>"Use "+f.name));
function historicalSupportInputs(list: HTMLElement) {
  return [...list.querySelectorAll<HTMLInputElement>("input")]
    .filter(input => !commonSupportLabels.has(input.getAttribute("aria-label") ?? ""));
}

function settings(): PassiveOptimizationSettings {
  return { mode: "weighted", extraPointBudget: 7, preferences: [{ id: "energyShield", weight: 3 }] };
}

describe("skill-informed preference controls", () => {
  it("offers the spell and utility breadth batch with separate damage, recovery and curse controls", async () => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), preferences: [...settings().preferences, { id: "criticalChance", weight: 2 }, { id: "spellDamage", weight: 1 }] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    await openPicker(screen.getByRole("combobox", { name: "Skill" }));
    for (const f of spellUtilityFixtures) expect(screen.getByRole("option", { name: f.name })).toBeTruthy();
    for (const id of ["convalescence","elemental-weakness","frost-darts","tornado","volcano"]) {
      const f = spellUtilityFixtures.find(f => f.id === id)!;
      selectPickerOption(screen.getByRole("combobox", { name: "Skill" }), id);
      current = onChange.mock.calls.at(-1)![0];
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      expect(current.preferences).toEqual(initial.preferences);
      expect(historicalSupportInputs(screen.getByRole("list", { name: `${f.name} reviewed supports` }))).toHaveLength(f.supports.length);
      const choose = (name: string) => {
        fireEvent.click(screen.getByRole("checkbox", { name: `Use ${name}` }));
        current = onChange.mock.calls.at(-1)![0];
        rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      };
      if (id === "convalescence") {
        expect(screen.queryByRole("checkbox", { name: "Use Mobility" })).toBeNull();
        expect(screen.queryByRole("checkbox", { name: `Use Spell Damage for ${f.name}` })).toBeNull();
        expect(screen.getByRole("checkbox", { name: `Use ES Recharge Rate for ${f.name}` })).toBeTruthy();
        choose("Efficiency II");
        expect(document.getElementById("support-efficiency-ii-summary")!.textContent).toContain("parent still reserves 30 Spirit");
      } else if (id === "elemental-weakness") {
        expect(screen.queryByRole("checkbox", { name: "Use Considered Casting" })).toBeNull();
        expect(screen.queryByRole("checkbox", { name: `Use Elemental Damage for ${f.name}` })).toBeNull();
        choose("Ritualistic Curse");
        expect(document.getElementById("support-ritualistic-curse-summary")!.textContent).toContain("1950 ms");
        expect(screen.getByRole("button", { name: "Apply support priorities" })).toBeTruthy();
      } else if (id === "frost-darts") {
        choose("Controlled Destruction");
        expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toContain("prevents this supported skill from critically hitting");
        expect(screen.queryByRole("checkbox", { name: `Use Spell Area Damage for ${f.name}` })).toBeNull();
        expect(screen.getByRole("checkbox", { name: "Use Projectile Acceleration II" })).toBeTruthy();
      } else if (id === "tornado") {
        choose("Concentrated Area");
        expect(document.getElementById("support-concentrated-area-summary")!.textContent).toContain("no native damage benefit");
        expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
        expect(screen.queryByRole("checkbox", { name: `Use Spell Area Damage for ${f.name}` })).toBeNull();
        expect(screen.getByRole("checkbox", { name: `Use Damage over Time for ${f.name}` })).toBeTruthy();
      } else {
        choose("Projectile Acceleration II");
        expect(document.getElementById("support-projectile-acceleration-ii-summary")!.textContent).toContain("Only affects the separate sprays");
        expect(screen.queryByRole("checkbox", { name: `Use Projectile Damage for ${f.name}` })).toBeNull();
        choose("Brutality III");
        for (const effect of ["Spell Damage","Spell Area Damage","Fire Damage"]) expect(screen.queryByRole("checkbox", { name: `Use ${effect} for ${f.name}` })).toBeNull();
      }
      expect(current.preferences).toEqual(initial.preferences);
      expect(current.extraPointBudget).toBe(initial.extraPointBudget);
    }
  });
  it("offers the remaining attack closure batch with explicit component and compatibility boundaries", async () => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), preferences: [...settings().preferences, { id: "accuracy", weight: 2 }, { id: "attackDamage", weight: 2 }] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    await openPicker(screen.getByRole("combobox", { name: "Skill" }));
    for (const f of attackClosureFixtures) expect(screen.getByRole("option", { name: f.name })).toBeTruthy();
    for (const id of ["cull-the-weak","elemental-sundering","trail-of-caltrops","flame-breath"]) {
      const f = attackClosureFixtures.find(f => f.id === id)!;
      selectPickerOption(screen.getByRole("combobox", { name: "Skill" }), id);
      current = onChange.mock.calls.at(-1)![0];
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      expect(current.preferences).toEqual(initial.preferences);
      expect(historicalSupportInputs(screen.getByRole("list", { name: `${f.name} reviewed supports` }))).toHaveLength(f.supportCount);
      if (id === "cull-the-weak") {
        expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toContain("always hits");
      } else if (id === "elemental-sundering") {
        expect(screen.getByText(/initial pulse is non-damaging/)).toBeTruthy();
        expect(screen.queryByRole("checkbox", { name: `Use Fire Damage for ${f.name}` })).toBeNull();
        fireEvent.click(screen.getByRole("checkbox", { name: "Use Brutality III" }));
        current = onChange.mock.calls.at(-1)![0];
        rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
        for (const effect of ["Attack Damage","Cold Damage","Attack Area Damage"]) expect(screen.queryByRole("checkbox", { name: `Use ${effect} for ${f.name}` })).toBeNull();
        expect(document.getElementById("support-brutality-iii-summary")!.textContent).toContain("focus deals no damage");
      } else if (id === "trail-of-caltrops") {
        expect(screen.queryByRole("checkbox", { name: "Use Rapid Attacks II" })).toBeNull();
        expect(screen.queryByRole("checkbox", { name: `Use Attack Speed for ${f.name}` })).toBeNull();
        fireEvent.click(screen.getByRole("checkbox", { name: "Use Efficiency II" }));
        current = onChange.mock.calls.at(-1)![0];
        rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
        expect(document.getElementById("support-efficiency-ii-summary")!.textContent).toContain("still reserves 30 Spirit");
        fireEvent.click(screen.getByRole("checkbox", { name: "Use Concentrated Area" }));
        current = onChange.mock.calls.at(-1)![0];
        rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
        expect(document.getElementById("support-concentrated-area-summary")!.textContent).toContain("hit damage is unchanged");
        expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
      } else {
        expect(screen.queryByRole("checkbox", { name: "Use Projectile Acceleration II" })).toBeNull();
        fireEvent.click(screen.getByRole("checkbox", { name: "Use Prolonged Duration II" }));
        current = onChange.mock.calls.at(-1)![0];
        rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
        expect(document.getElementById("support-prolonged-duration-ii-summary")!.textContent).toContain("does not extend the minimum channel");
      }
      expect(current.preferences).toEqual(initial.preferences);
      expect(current.extraPointBudget).toBe(initial.extraPointBudget);
    }
  });
  it("offers the mace/shield/Wyvern batch without transferring weapon damage or conditional uptime", async () => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), preferences: [...settings().preferences, { id: "fireDamage", weight: 2 }, { id: "attackDamage", weight: 2 }] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    await openPicker(screen.getByRole("combobox", { name: "Skill" }));
    for (const f of maceShieldFixtures) expect(screen.getByRole("option", { name: f.name })).toBeTruthy();
    for (const id of ["resonating-shield","rolling-magma","forge-hammer"]) {
      const f = maceShieldFixtures.find(f => f.id === id)!;
      selectPickerOption(screen.getByRole("combobox", { name: "Skill" }), id);
      current = onChange.mock.calls.at(-1)![0];
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      expect(current.preferences).toEqual(initial.preferences);
      expect(historicalSupportInputs(screen.getByRole("list", { name: `${f.name} reviewed supports` }))).toHaveLength(f.supportCount);
      if (id === "resonating-shield") {
        expect(screen.queryByRole("checkbox", { name: "Use Projectile Acceleration II" })).toBeNull();
        fireEvent.click(screen.getByRole("checkbox", { name: "Use Rapid Attacks II" }));
        current = onChange.mock.calls.at(-1)![0];
        rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
        expect(document.getElementById("support-rapid-attacks-ii-summary")!.textContent).toContain("native baseline leaves that cost unchanged");
      } else if (id === "rolling-magma") {
        expect(screen.queryByRole("checkbox", { name: "Use Physical Damage for Rolling Magma" })).toBeNull();
        fireEvent.click(screen.getByRole("checkbox", { name: "Use Brutality III" }));
        current = onChange.mock.calls.at(-1)![0];
        rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
        for (const effect of ["Attack Damage","Fire Damage","Projectile Damage","Attack Area Damage"]) expect(screen.queryByRole("checkbox", { name: `Use ${effect} for Rolling Magma` })).toBeNull();
        expect(document.getElementById("support-brutality-iii-summary")!.textContent).toContain("fully Fire-converted Rolling Magma focus deals no damage");
      } else {
        expect(screen.queryByRole("checkbox", { name: "Use Projectile Acceleration II" })).toBeNull();
        fireEvent.click(screen.getByRole("checkbox", { name: "Use Prolonged Duration II" }));
        current = onChange.mock.calls.at(-1)![0];
        rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
        expect(document.getElementById("support-prolonged-duration-ii-summary")!.textContent).toContain("postpone cooldown recovery");
        expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
      }
      expect(current.preferences).toEqual(initial.preferences);
    }
  });
  it("offers the Monk batch with independent crystal, always-hit Palm and Bell cautions", async () => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), preferences: [...settings().preferences, { id: "accuracy", weight: 2 }] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    await openPicker(screen.getByRole("combobox", { name: "Skill" }));
    for (const f of monkPrimaryFixtures) expect(screen.getByRole("option", { name: f.name })).toBeTruthy();
    for (const id of ["frozen-locus","killing-palm","staggering-palm","hand-of-chayula","tempest-bell"]) {
      const f = monkPrimaryFixtures.find(f => f.id === id)!;
      selectPickerOption(screen.getByRole("combobox", { name: "Skill" }), id);
      current = onChange.mock.calls.at(-1)![0];
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      expect(current.preferences).toEqual(initial.preferences);
      expect(historicalSupportInputs(screen.getByRole("list", { name: `${f.name} reviewed supports` }))).toHaveLength(f.supportCount);
      expect(screen.queryByRole("checkbox", { name: "Use Projectile Acceleration II" })).toBeNull();
      if (!f.accuracy) expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toContain("always hits");
      if (id === "frozen-locus") {
        expect(screen.queryByRole("checkbox", { name: "Use Physical Damage for Frozen Locus" })).toBeNull();
        fireEvent.click(screen.getByRole("checkbox", { name: "Use Brutality III" }));
        current = onChange.mock.calls.at(-1)![0];
        rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
        for (const effect of ["Attack Damage","Cold Damage","Attack Area Damage"]) expect(screen.queryByRole("checkbox", { name: `Use ${effect} for Frozen Locus` })).toBeNull();
      } else if (id === "staggering-palm" || id === "tempest-bell") {
        fireEvent.click(screen.getByRole("checkbox", { name: "Use Prolonged Duration II" }));
        current = onChange.mock.calls.at(-1)![0];
        rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
        expect(document.getElementById("support-prolonged-duration-ii-summary")!.textContent).toContain(id === "tempest-bell" ? "ten-hit durability limit" : "30-second extension cap");
        expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
      } else if (id === "hand-of-chayula") {
        fireEvent.click(screen.getByRole("checkbox", { name: "Use Rapid Attacks II" }));
        current = onChange.mock.calls.at(-1)![0];
        rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
        expect(document.getElementById("support-rapid-attacks-ii-summary")!.textContent).toContain("fixed 350 ms");
      }
      expect(current.preferences).toEqual(initial.preferences);
    }
  });
  it("offers the spear breadth batch with Glory, lodged-bolt and collapse component cautions", async () => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), preferences: [...settings().preferences, { id: "accuracy", weight: 2 }] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    await openPicker(screen.getByRole("combobox", { name: "Skill" }));
    for (const f of spearPrimaryFixtures) expect(screen.getByRole("option", { name: f.name })).toBeTruthy();
    for (const id of ["spear-of-solaris","storm-lance","whirlwind-lance"]) {
      const f = spearPrimaryFixtures.find(f => f.id === id)!;
      selectPickerOption(screen.getByRole("combobox", { name: "Skill" }), id);
      current = onChange.mock.calls.at(-1)![0];
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      expect(current.preferences).toEqual(initial.preferences);
      expect(historicalSupportInputs(screen.getByRole("list", { name: `${f.name} reviewed supports` }))).toHaveLength(f.supportCount);
      if (id === "spear-of-solaris") {
        expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toContain("always hits");
        expect(screen.getByText(/Use requires maximum Glory/)).toBeTruthy();
      } else if (id === "storm-lance") {
        expect(screen.queryByRole("checkbox", { name: "Use Physical Damage for Storm Lance" })).toBeNull();
        fireEvent.click(screen.getByRole("checkbox", { name: "Use Concentrated Area" }));
        current = onChange.mock.calls.at(-1)![0];
        rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
        expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
        expect(document.getElementById("support-concentrated-area-summary")!.textContent).toContain("damage is unchanged");
        fireEvent.click(screen.getByRole("checkbox", { name: "Use Brutality III" }));
        current = onChange.mock.calls.at(-1)![0];
        rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
        for (const effect of ["Attack Damage","Lightning Damage","Projectile Damage"]) expect(screen.queryByRole("checkbox", { name: `Use ${effect} for Storm Lance` })).toBeNull();
      } else {
        expect(screen.queryByRole("checkbox", { name: "Use Projectile Damage for Whirlwind Lance" })).toBeNull();
        fireEvent.click(screen.getByRole("checkbox", { name: "Use Projectile Acceleration II" }));
        current = onChange.mock.calls.at(-1)![0];
        rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
        expect(document.getElementById("support-projectile-acceleration-ii-summary")!.textContent).toContain("does not improve the selected melee Whirlwind collapse");
      }
      expect(current.preferences).toEqual(initial.preferences);
    }
  });
  it("offers the bow breadth batch while separating DoT, conditional area hits and non-area delivery", async () => {
    const onChange = vi.fn();
    let current = settings();
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    await openPicker(screen.getByRole("combobox", { name: "Skill" }));
    for (const f of bowPrimaryFixtures) expect(screen.getByRole("option", { name: f.name })).toBeTruthy();
    for (const id of ["tornado-shot","snipe","spiral-volley"]) {
      const f = bowPrimaryFixtures.find(f => f.id === id)!;
      selectPickerOption(screen.getByRole("combobox", { name: "Skill" }), id);
      current = onChange.mock.calls.at(-1)![0];
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      expect(current.preferences).toEqual(settings().preferences);
      expect(historicalSupportInputs(screen.getByRole("list", { name: `${f.name} reviewed supports` }))).toHaveLength(f.supportCount);
      expect(screen.queryByRole("checkbox", { name: `Use Attack Area Damage for ${f.name}` })).toBeNull();
      if (id === "tornado-shot") {
        expect(screen.getByRole("checkbox", { name: "Use Damage over Time for Tornado Shot" })).toBeTruthy();
        expect(screen.queryByRole("checkbox", { name: "Use Attack Damage for Tornado Shot" })).toBeNull();
        fireEvent.click(screen.getByRole("checkbox", { name: "Use Concentrated Area" }));
        current = onChange.mock.calls.at(-1)![0];
        rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
        expect(screen.getByRole("button", { name: "Apply support priorities" })).toBeTruthy();
      } else if (id === "snipe") {
        expect(screen.queryByRole("checkbox", { name: "Use Cold Damage for Snipe" })).toBeNull();
        fireEvent.click(screen.getByRole("checkbox", { name: "Use Concentrated Area" }));
        current = onChange.mock.calls.at(-1)![0];
        rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
        expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
        expect(document.getElementById("support-concentrated-area-summary")!.textContent).toContain("is unchanged");
      } else {
        expect(screen.queryByRole("checkbox", { name: "Use Concentrated Area" })).toBeNull();
        expect(screen.queryByRole("checkbox", { name: "Use Magnified Area I" })).toBeNull();
        expect(current.supportGemIds).toBeUndefined();
      }
    }
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Rapid Attacks II" }));
    current = onChange.mock.calls.at(-1)![0];
    expect(current.preferences).toEqual(settings().preferences);
    expect(current.supportGemIds).toEqual(["rapid-attacks-ii"]);
  });
  it("offers the complete quarterstaff and mace batches in the skill picker", async () => {
    render(<SkillPreferencePresetControls settings={settings()} onChange={vi.fn()} disabled={false} />);
    await openPicker(screen.getByRole("combobox", { name: "Skill" }));
    for (const f of [...quarterstaffPrimaryFixtures, ...macePrimaryFixtures]) expect(screen.getByRole("option", { name: f.name })).toBeTruthy();
  });

  it.each(quarterstaffPrimaryFixtures)("offers $name with common quarterstaff supports and component cautions", f => {
    const onChange = vi.fn();
    let current = settings();
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    selectPickerOption(screen.getByRole("combobox", { name: "Skill" }), f.id);
    current = onChange.mock.calls.at(-1)![0];
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    expect(current.preferences).toEqual(settings().preferences);
    expect(historicalSupportInputs(screen.getByRole("list", { name: `${f.name} reviewed supports` }))).toHaveLength(f.id === "falling-thunder" ? 12 : 10);
    expect(screen.queryByRole("checkbox", { name: "Use Spell Echo" })).toBeNull();
    expect(screen.queryByRole("checkbox", { name: "Use Prolonged Duration I" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Rapid Attacks II" }));
    current = onChange.mock.calls.at(-1)![0];
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-rapid-attacks-ii-summary")!.textContent).toContain("Manual priorities are retained");
    expect(current.preferences).toEqual(settings().preferences);
  });

  it("keeps manual weights and resets prior quarterstaff links when changing to Glacial Cascade", () => {
    const onChange = vi.fn();
    let current: PassiveOptimizationSettings = { ...settings(), focusSkillId: quarterstaffPrimaryFixtures.at(-1)!.id, supportGemIds: ["rapid-attacks-ii"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    selectPickerOption(screen.getByRole("combobox", { name: "Skill" }), "glacial-cascade");
    current = onChange.mock.calls.at(-1)![0];
    expect(current.supportGemIds).toBeUndefined();
    expect(current.preferences).toEqual(settings().preferences);
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    expect(screen.getByText(/not Melee Damage despite/)).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Brutality III" }));
    current = onChange.mock.calls.at(-1)![0];
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    expect(screen.queryByRole("checkbox", { name: "Use Cold Damage for Glacial Cascade" })).toBeNull();
    expect(document.getElementById("support-brutality-iii-summary")!.textContent).toContain("converted Elemental damage");
  });
  it.each(macePrimaryFixtures)("offers $name through mace controls, preserving manual weights and component cautions", f => {
    const onChange = vi.fn();
    let current = settings();
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    selectPickerOption(screen.getByRole("combobox", { name: "Skill" }), f.id);
    current = onChange.mock.calls.at(-1)![0];
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    expect(current.preferences).toEqual(settings().preferences);
    expect(historicalSupportInputs(screen.getByRole("list", { name: `${f.name} reviewed supports` }))).toHaveLength(10);
    if (f.id === "supercharged-slam") expect(screen.queryByRole("checkbox", { name: `Use Attack Speed for ${f.name}` })).toBeNull();
    if (f.id === "hammer-of-the-gods") expect(screen.queryByRole("checkbox", { name: `Use Cooldown Recovery Rate for ${f.name}` })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Concentrated Area" }));
    current = onChange.mock.calls.at(-1)![0];
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    expect(screen.getByRole("button", { name: "Apply support priorities" })).toBeTruthy();
    expect(current.preferences).toEqual(settings().preferences);
  });

  it("keeps Volcanic Fissure's conversion caution with Concentrated Area and Brutality", () => {
    const onChange = vi.fn();
    let current: PassiveOptimizationSettings = { ...settings(), focusSkillId: "volcanic-fissure", supportGemIds: ["concentrated-area"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Brutality III" }));
    current = onChange.mock.calls.at(-1)![0];
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    expect(screen.queryByRole("checkbox", { name: "Use Fire Damage for Volcanic Fissure" })).toBeNull();
    expect(document.getElementById("support-brutality-iii-summary")!.textContent).toContain("only the unconverted Physical portion remains");
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("warns about %s's disabled Poison under Brutality without changing manual weights or peer links", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "poisonMagnitude",weight: 3 },{ id: "physicalDamage",weight: 2 },{ id: "bleedingMagnitude",weight: 3 },{ id: "fireDamage",weight: 1 }],
      supportGemIds: ["bleed-iii","poison-iii","deadly-poison-ii","deep-cuts-ii","pin-i","stun-iii","rupture",...(focusSkillId === "gas-arrow" ? ["overabundance-ii"] : [])] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const label = getSkillPreferencePreset(focusSkillId)!.name;
    const previous = Object.fromEntries([...document.querySelectorAll('.skill-supports [id$="-summary"]')].map(el => [el.id,el.textContent]));
    let selected = initial;
    expect(screen.getByRole("checkbox", { name: `Use Poison Magnitude for ${label}` })).toBeTruthy();
    for (const f of poisonBowBrutalitySupports) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      selected = onChange.mock.calls.at(-1)![0];
      expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,f.id] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      for (const tier of poisonBowBrutalitySupports) expect(screen.getByRole("checkbox", { name: `Use ${tier.name}` })).toHaveProperty("checked",tier.id === f.id);
      const text = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      expect(text.startsWith("Disables this focus's Poison damage")).toBe(true);
      for (const expected of [`${f.morePhysical}% more Physical Damage`,"no Chaos or Elemental damage","separate Bleeding chance source","20% higher Mana cost","manual weights remain and still affect routing"]) expect(text).toContain(expected);
      if (f.ignoreChance) expect(text).toContain("or a Bleeding bypass");
      if (focusSkillId === "gas-arrow") expect(text).toContain("blocking Fire does not restore Physical damage after conversion");
      expect(screen.queryByRole("checkbox", { name: `Use Poison Magnitude for ${label}` })).toBeNull();
      expect(screen.queryByRole("checkbox", { name: `Use Physical Damage for ${label}` })).toBeNull();
      const warnings = screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent!;
      for (const expected of ["Poison Magnitude", "Brutality prevents this supported skill's Poison damage", "Physical Damage", "does not switch this Poison focus", "Fire Damage", "still affects routing"]) expect(warnings).toContain(expected);
      for (const [id,note] of Object.entries(previous)) expect(document.getElementById(id)!.textContent).toBe(note);
      expect(screen.queryByRole("button", { name: /Apply support priorities/ })).toBeNull();
    }
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Brutality III" }));
    selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(screen.getByRole("checkbox", { name: `Use Poison Magnitude for ${label}` })).toHaveProperty("checked",true);
    expect(screen.getByRole("checkbox", { name: `Use Physical Damage for ${label}` })).toHaveProperty("checked",true);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled />);
    for (const f of poisonBowBrutalitySupports) expect(screen.getByRole("checkbox", { name: `Use ${f.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("reviews %s's Deep Cuts trade-offs and replaces only its own tier", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "bleedingMagnitude",weight: 3 },{ id: "poisonMagnitude",weight: 3 }],
      supportGemIds: ["bleed-iii","poison-iii","deadly-poison-ii","pin-i","stun-iii","rupture","rusted-spikes",...(focusSkillId === "gas-arrow" ? ["overabundance-ii"] : [])] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    let selected = initial;
    const previous = Object.fromEntries([...document.querySelectorAll('.skill-supports [id$="-summary"]')].map(el => [el.id,el.textContent]));
    for (const f of poisonBowDeepCutsSupports) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      selected = onChange.mock.calls.at(-1)![0];
      expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,f.id] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      for (const tier of poisonBowDeepCutsSupports) expect(screen.getByRole("checkbox", { name: `Use ${tier.name}` })).toHaveProperty("checked",tier.id === f.id);
      const text = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      for (const expected of [`${f.lessHit}% less Damage with Hits`,`${f.moreBleed}% more Bleeding magnitude, not Poison magnitude`,
        "Does not grant Bleeding chance", "reduces the stored damage used for weapon-derived Poison", "No added Mana multiplier", "Manual weights and route scores stay unchanged"]) expect(text).toContain(expected);
      for (const [id,note] of Object.entries(previous)) expect(document.getElementById(id)!.textContent).toBe(note);
      expect(screen.queryByRole("button", { name: /Apply support priorities/ })).toBeNull();
    }
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Deep Cuts II" }));
    selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled />);
    for (const f of poisonBowDeepCutsSupports) expect(screen.getByRole("checkbox", { name: `Use ${f.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("reviews %s's conditional aggravation and reversible Pin notes without adding Poison power", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "bleedingMagnitude",weight: 3 },{ id: "poisonMagnitude",weight: 3 },{ id: "pinBuildup",weight: 2 }],
      supportGemIds: ["bleed-iii","poison-iii","stun-iii","armour-explosion",...(focusSkillId === "gas-arrow" ? ["overabundance-ii"] : [])] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    let selected = initial;
    const previous = Object.fromEntries([...document.querySelectorAll('.skill-supports [id$="-summary"]')].map(el => [el.id,el.textContent]));
    for (const f of poisonBowBleedAggravationSupports) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      selected = onChange.mock.calls.at(-1)![0];
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      const text = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      for (const expected of ["Aggravation affects Bleeding, not Poison", "does not map either support's aggravation stat", "one existing damage factor",
        "Manual weights and route scores stay unchanged"]) expect(text).toContain(expected);
      if (f.id === "rusted-spikes") expect(text.startsWith("Catalog-only review: tier 0")).toBe(true);
      for (const [id,note] of Object.entries(previous)) expect(document.getElementById(id)!.textContent).toBe(note);
    }
    const beforePin = Object.fromEntries(poisonBowBleedAggravationSupports.map(f => [f.id,document.getElementById(`support-${f.id}-summary`)!.textContent]));
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Pin I" }));
    selected = onChange.mock.calls.at(-1)![0];
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-rupture-summary")!.textContent).toContain("cannot supply its own Heavy Stun for Rupture");
    expect(document.getElementById("support-rupture-summary")!.textContent).toContain("can still Hit a target Heavily Stunned by a separate source");
    expect(document.getElementById("support-rusted-spikes-summary")!.textContent!.startsWith("Catalog-only review: tier 0")).toBe(true);
    expect(document.getElementById("support-rusted-spikes-summary")!.textContent).toContain("does not prove a new supported-skill Pin event");
    expect(document.getElementById("support-stun-iii-summary")!.textContent).toContain("Pin is selected: this supported skill cannot Stun");
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Pin I" }));
    selected = onChange.mock.calls.at(-1)![0];
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    for (const [id,text] of Object.entries(beforePin)) expect(document.getElementById(`support-${id}-summary`)!.textContent).toBe(text);
    for (const f of poisonBowBleedAggravationSupports) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      selected = onChange.mock.calls.at(-1)![0];
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    }
    expect(selected).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled />);
    for (const f of poisonBowBleedAggravationSupports) expect(screen.getByRole("checkbox", { name: `Use ${f.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("reviews %s's Armour Explosion without merging triggered hits and Poison or assuming full-break events", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "armourBreakAmount",weight: 3 },{ id: "fireDamage",weight: 2 },{ id: "poisonMagnitude",weight: 3 }],
      supportGemIds: ["armour-break-iii","armour-demolisher-ii","corrosion","poison-iii","bursting-plague",...(focusSkillId === "gas-arrow" ? ["overabundance-ii"] : [])] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const previous = Object.fromEntries([...document.querySelectorAll('.skill-supports [id$="-summary"]')].map(el => [el.id,el.textContent]));
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Armour Explosion" }));
    let selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,"armour-explosion"] });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    const note = document.getElementById("support-armour-explosion-summary")!.textContent!;
    for (const text of ["separate player-owned Fire Area Attack", "only when this supported skill Fully Breaks",
      "another skill/minion's full break", "cannot Break Armour itself: no self-triggering break loop", "does not map the full-break trigger linkage/chance",
      "not verified trigger frequency or guaranteed extra damage", "zero Mana cost does not waive parent firing", "Manual weights and route scores stay unchanged"]) expect(note).toContain(text);
    for (const [id,text] of Object.entries(previous)) expect(document.getElementById(id)!.textContent).toBe(text);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Exploit Weakness" }));
    selected = onChange.mock.calls.at(-1)![0];
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-armour-explosion-summary")!.textContent).toContain("this parent cannot Break Armour and cannot supply Armour Explosion's supported-skill full-break event");
    for (const id of ["corrosion","exploit-weakness"]) expect(document.getElementById(`support-${id}-summary`)!.textContent).toContain("Corrosion is ignored in either link order");
    expect(document.getElementById("support-armour-demolisher-ii-summary")!.textContent).toContain("Demolisher's strength modifier does not bypass");
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Exploit Weakness" }));
    selected = onChange.mock.calls.at(-1)![0];
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-armour-explosion-summary")!.textContent).toBe(note);
    for (const [id,text] of Object.entries(previous)) expect(document.getElementById(id)!.textContent).toBe(text);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Armour Explosion" }));
    selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Armour Explosion" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("reviews %s's Demolisher tiers without changing earlier break/Poison warnings or weights", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "armourBreakAmount",weight: 3 },{ id: "physicalDamage",weight: 2 },{ id: "poisonMagnitude",weight: 3 }],
      supportGemIds: ["armour-break-iii","corrosion","poison-iii","life-drain","soul-drain",...(focusSkillId === "gas-arrow" ? ["overabundance-ii"] : [])] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const previous = Object.fromEntries([...document.querySelectorAll('.skill-supports [id$="-summary"]')].map(el => [el.id,el.textContent]));
    let selected = initial;
    for (const f of poisonBowArmourDemolisherSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      selected = onChange.mock.calls.at(-1)![0];
      expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,f.id] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      for (const text of [`${f.amount}% more Armour Break (${f.factor}x break strength)`, "not more Hit damage, Poison DPS",
        "Does not grant an Armour Break source", "ArmourBreakEffect More modifier separately from ArmourBreakPerHit",
        "Corrosion remains ineligible with Exploit Weakness", "No added Mana multiplier", "Manual weights and route scores stay unchanged"]) expect(note).toContain(text);
      for (const peer of poisonBowArmourDemolisherSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${peer.name}` })).toHaveProperty("checked",peer.id === f.id);
      for (const [id,text] of Object.entries(previous)) expect(document.getElementById(id)!.textContent).toBe(text);
    }
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Exploit Weakness" }));
    selected = onChange.mock.calls.at(-1)![0];
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-armour-demolisher-ii-summary")!.textContent).toContain("Exploit Weakness is selected: this skill cannot Break Armour");
    for (const id of ["corrosion","exploit-weakness"]) expect(document.getElementById(`support-${id}-summary`)!.textContent).toContain("Corrosion is ignored in either link order");
    expect(document.getElementById("support-armour-break-iii-summary")!.textContent).toContain("the support can remain linked, but this skill cannot Break Armour");
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Exploit Weakness" }));
    selected = onChange.mock.calls.at(-1)![0];
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-armour-demolisher-ii-summary")!.textContent).not.toContain("Exploit Weakness is selected:");
    for (const [id,text] of Object.entries(previous)) expect(document.getElementById(id)!.textContent).toBe(text);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Armour Demolisher II" }));
    selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled />);
    for (const f of poisonBowArmourDemolisherSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${f.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("reviews %s's Armour Break tiers with reversible Exploit and Corrosion warnings", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "armourBreakAmount",weight: 3 },{ id: "physicalDamage",weight: 2 },{ id: "poisonMagnitude",weight: 3 }],
      supportGemIds: ["corrosion","poison-iii","life-drain","soul-drain","pin-iii","stun-iii",...(focusSkillId === "gas-arrow" ? ["overabundance-ii"] : [])] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const previous = Object.fromEntries([...document.querySelectorAll('.skill-supports [id$="-summary"]')].map(el => [el.id,el.textContent]));
    let selected = initial;
    for (const f of poisonBowArmourBreakSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      selected = onChange.mock.calls.at(-1)![0];
      expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,f.id] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      for (const text of [`${f.amount}% of Physical damage dealt`, "not real hit-based Armour Break", "CanArmourBreak capability flag",
        "does not calculate this percentage-based break amount", "Corrosion's separate 80%-of-Poison-damage Armour Break",
        "No added Mana multiplier", "Manual weights and route scores stay unchanged"]) expect(note).toContain(text);
      if (f.chargeChance) expect(note).toContain(`${f.chargeChance}% chance to gain an Endurance Charge on Fully Breaking Armour`);
      for (const peer of poisonBowArmourBreakSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${peer.name}` })).toHaveProperty("checked",peer.id === f.id);
      for (const [id,text] of Object.entries(previous)) expect(document.getElementById(id)!.textContent).toBe(text);
    }
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Exploit Weakness" }));
    selected = onChange.mock.calls.at(-1)![0];
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    for (const id of ["armour-break-iii","exploit-weakness"]) expect(document.getElementById(`support-${id}-summary`)!.textContent).toContain("the support can remain linked, but this skill cannot Break Armour");
    for (const id of ["corrosion","exploit-weakness"]) expect(document.getElementById(`support-${id}-summary`)!.textContent).toContain("Corrosion is ignored in either link order");
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Exploit Weakness" }));
    selected = onChange.mock.calls.at(-1)![0];
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-armour-break-iii-summary")!.textContent).not.toContain("Exploit Weakness is selected with Armour Break");
    for (const [id,text] of Object.entries(previous)) expect(document.getElementById(id)!.textContent).toBe(text);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Armour Break III" }));
    selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled />);
    for (const f of poisonBowArmourBreakSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${f.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("reviews %s's Drain choices with both Culling Strike tiers without merging recovery or assuming sustain", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "lifeRecoveryOnKill",weight: 3 },{ id: "manaRecoveryOnKill",weight: 3 },{ id: "lifeLeechAmount",weight: 2 },{ id: "poisonMagnitude",weight: 3 }],
      supportGemIds: ["culling-strike-i","life-leech-iii","mana-leech","pin-iii","stun-iii","poison-iii",...(focusSkillId === "gas-arrow" ? ["overabundance-ii"] : [])] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const previous = Object.fromEntries([...document.querySelectorAll('.skill-supports [id$="-summary"]')].map(el => [el.id,el.textContent]));
    let selected = initial;
    for (const f of poisonBowDrainSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      selected = onChange.mock.calls.at(-1)![0];
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      for (const text of [`Recover 12% of maximum ${f.resource} when this supported skill Culls`, "not Leech, recovery on Hit or recovery on every kill",
        "Neither Drain grants Culling Strike", "only Rare/Unique enemies qualify", "Poison deaths, ordinary kills", "not real Culls or recovery events",
        "No added Mana multiplier", "event frequency, boss sustain", "Manual weights and route scores stay unchanged"]) expect(note).toContain(text);
      if (f.resource === "Life") expect(note).toContain("generic LifeOnKill field even when no Cull is possible");
      else expect(note).toContain("zero ManaOnKill is not proof of zero effect in game");
      for (const [id,text] of Object.entries(previous)) expect(document.getElementById(id)!.textContent).toBe(text);
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    }
    expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,"life-drain","soul-drain"] });
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Culling Strike II" }));
    selected = onChange.mock.calls.at(-1)![0];
    const changedPeers = [...initial.supportGemIds!.filter(id => id !== "culling-strike-i"),"culling-strike-ii"];
    expect(selected.preferences).toEqual(initial.preferences);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(screen.getByRole("checkbox", { name: "Use Life Drain" })).toHaveProperty("checked",true);
    expect(screen.getByRole("checkbox", { name: "Use Soul Drain" })).toHaveProperty("checked",true);
    expect(document.getElementById("support-culling-strike-ii-summary")!.textContent).toContain("does not calculate this conditional bonus");
    for (const f of poisonBowDrainSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      selected = onChange.mock.calls.at(-1)![0];
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      expect(document.getElementById(`support-${f.id}-summary`)).toBeNull();
    }
    expect(selected).toEqual({ ...initial,supportGemIds: changedPeers });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled />);
    for (const f of poisonBowDrainSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${f.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("reviews %s's Pin tiers and reversible Stun warnings without supplying immobilisation uptime", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "pinBuildup",weight: 3 },{ id: "stunBuildup",weight: 2 },{ id: "criticalChance",weight: 2 },{ id: "poisonMagnitude",weight: 3 }],
      supportGemIds: ["stun-iii","pinpoint-critical","life-leech-iii","mana-leech","poison-iii",...(focusSkillId === "gas-arrow" ? ["overabundance-ii"] : [])] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const previous = Object.fromEntries([...document.querySelectorAll('.skill-supports [id$="-summary"]')].map(el => [el.id,el.textContent]));
    const caution = screen.queryByRole("note", { name: "Preferences outside this skill focus" })?.textContent;
    let selected = initial;
    for (const f of poisonBowPinSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      selected = onChange.mock.calls.at(-1)![0];
      expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,f.id] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      for (const peer of poisonBowPinSupportFixtures)
        expect((screen.getByRole("checkbox", { name: `Use ${peer.name}` }) as HTMLInputElement).checked).toBe(peer.id === f.id);
      const note = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      for (const text of ["Physical damage from actual Hits can build Pin", "cannot Stun", "Generic Stun Buildup modifiers redirect to Pin instead",
        "supplies no Pin Buildup", "not real Pin applications", "No added Mana multiplier from Pin itself", "immobilisation uptime",
        "Manual weights and route scores stay unchanged"]) expect(note).toContain(text);
      if (f.tier === 2) for (const text of ["50% increased Critical Hit Chance only against Immobilised enemies", "5% becomes 7.5% before caps",
        "not 50 percentage points or a More multiplier", "fixed snapshot"]) expect(note).toContain(text);
      if (f.tier === 3) for (const text of ["60% less Pin Buildup (0.4x)", "30% more Pin duration", "does not map this duration stat",
        "no live duration in seconds is claimed"]) expect(note).toContain(text);
      if (focusSkillId === "gas-arrow") expect(note).toContain("Fire explosion supplies no Physical Pin buildup");
      for (const [id,text] of Object.entries(previous)) {
        if (id === "support-stun-iii-summary") {
          expect(document.getElementById(id)!.textContent).toContain("Pin is selected: this supported skill cannot Stun");
          expect(document.getElementById(id)!.textContent).toContain("Stun III's damage penalty and all Stun tiers' Mana multipliers still apply");
        } else expect(document.getElementById(id)!.textContent).toBe(text);
      }
      expect(screen.queryByRole("note", { name: "Preferences outside this skill focus" })?.textContent).toBe(caution);
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
      expect(screen.queryByRole("checkbox", { name: "Enemy Immobilised" })).toBeNull();
    }
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Pin III" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-pin-iii-summary")).toBeNull();
    for (const [id,text] of Object.entries(previous)) expect(document.getElementById(id)!.textContent).toBe(text);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Pin III" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("reviews %s's Stun tiers without changing weights or assuming Heavy Stun uptime", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "stunBuildup",weight: 3 },{ id: "poisonMagnitude",weight: 3 },{ id: "manaCostEfficiency",weight: 2 }],
      supportGemIds: ["life-leech-iii","mana-leech","ambush","poison-iii","corrosion","inexorable-critical-ii",...(focusSkillId === "gas-arrow" ? ["overabundance-ii"] : [])] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const caution = screen.queryByRole("note", { name: "Preferences outside this skill focus" })?.textContent;
    const previous = Object.fromEntries([...document.querySelectorAll('.skill-supports [id$="-summary"]')].map(el => [el.id,el.textContent]));
    let selected = initial;
    for (const f of poisonBowStunSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      selected = onChange.mock.calls.at(-1)![0];
      expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,f.id] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      for (const peer of poisonBowStunSupportFixtures)
        expect((screen.getByRole("checkbox", { name: `Use ${peer.name}` }) as HTMLInputElement).checked).toBe(peer.id === f.id);
      const note = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      for (const text of [`${f.more}% more Stun Buildup for actual Hits`, "supplies no Stun Buildup", "source-hit buildup fields are not real stuns",
        "20% higher Mana cost before rounding", "Cannot Immobilise Enemies still prevents Heavy Stun", "not Stun duration, guaranteed Heavy Stun or uptime",
        "Manual weights and route scores stay unchanged"]) expect(note).toContain(text);
      if (f.lessDamage) for (const text of ["50% less Damage is a broad penalty, not Hits-only", "weapon-derived Poison source", "not 4x the original total buildup",
        "do not apply the damage penalty twice"]) expect(note).toContain(text);
      else expect(note).toContain("No added damage penalty or Poison damage bonus");
      if (focusSkillId === "gas-arrow") expect(note).toContain("conditional Fire explosion");
      for (const [id,text] of Object.entries(previous)) expect(document.getElementById(id)!.textContent).toBe(text);
      expect(screen.queryByRole("note", { name: "Preferences outside this skill focus" })?.textContent).toBe(caution);
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
      expect(screen.queryByRole("checkbox", { name: "Enemy Heavy Stunned" })).toBeNull();
    }
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Stun III" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-stun-iii-summary")).toBeNull();
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Stun III" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("reviews %s's Mana Leech without replacing Life Leech or assuming sustainable firing", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "manaLeechAmount",weight: 3 },{ id: "manaCostEfficiency",weight: 2 },{ id: "poisonMagnitude",weight: 3 }],
      supportGemIds: ["life-leech-iii","ambush","poison-iii","corrosion","inexorable-critical-ii",...(focusSkillId === "gas-arrow" ? ["overabundance-ii"] : [])] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const caution = screen.queryByRole("note", { name: "Preferences outside this skill focus" })?.textContent;
    const previous = Object.fromEntries([...document.querySelectorAll('.skill-supports [id$="-summary"]')].map(el => [el.id,el.textContent]));
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Mana Leech" }));
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,"mana-leech"] });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    const note = document.getElementById("support-mana-leech-summary")!.textContent!;
    for (const text of ["8% of Physical Attack Damage Leeched as Mana", "generates no recovery from this support", "source-hit leech fields are not real Mana recovery",
      "Cannot Leech Mana and Cannot Gain Mana", "No added Mana multiplier is not a refund", "upfront Mana expenditure and later hit recovery remain separate",
      "other supports still cost Mana", "No guaranteed hits, recovery uptime, sustainable firing", "Manual weights and route scores stay unchanged"]) expect(note).toContain(text);
    if (focusSkillId === "gas-arrow") expect(note).toContain("supplies no Physical-hit leech");
    expect((screen.getByRole("checkbox", { name: "Use Life Leech III" }) as HTMLInputElement).checked).toBe(true);
    for (const [id,text] of Object.entries(previous)) expect(document.getElementById(id)!.textContent).toBe(text);
    expect(screen.queryByRole("note", { name: "Preferences outside this skill focus" })?.textContent).toBe(caution);
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Mana Leech" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-mana-leech-summary")).toBeNull();
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Mana Leech" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("reviews %s's Life Leech tiers without assuming Poison recovery or Full Life sustain", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "lifeLeechAmount",weight: 3 },{ id: "lifeLeechSpeed",weight: 2 },{ id: "poisonMagnitude",weight: 3 }],
      supportGemIds: ["ambush","poison-iii","corrosion","inexorable-critical-ii",...(focusSkillId === "gas-arrow" ? ["overabundance-ii"] : [])] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const caution = screen.queryByRole("note", { name: "Preferences outside this skill focus" })?.textContent;
    const previous = Object.fromEntries([...document.querySelectorAll('.skill-supports [id$="-summary"]')].map(el => [el.id,el.textContent]));
    let selected = initial;
    for (const f of poisonBowLifeLeechSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      selected = onChange.mock.calls.at(-1)![0];
      expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,f.id] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      for (const peer of poisonBowLifeLeechSupportFixtures)
        expect((screen.getByRole("checkbox", { name: `Use ${peer.name}` }) as HTMLInputElement).checked).toBe(peer.id === f.id);
      const note = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      for (const text of [`${f.percent}% of Physical Attack Damage`, "generates no recovery from this support", "source-hit leech fields are not real healing",
        "No sustained hits, recovery uptime", "No added Mana multiplier", "Manual weights and route scores stay unchanged"]) expect(note).toContain(text);
      if (f.retains) expect(note).toContain("runtime does not model this source-specific retention stat");
      else expect(note).toContain("does not grant retention");
      if (focusSkillId === "gas-arrow") expect(note).toContain("supplies no Physical-hit leech");
      for (const [id,text] of Object.entries(previous)) expect(document.getElementById(id)!.textContent).toBe(text);
      expect(screen.queryByRole("note", { name: "Preferences outside this skill focus" })?.textContent).toBe(caution);
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    }
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Life Leech III" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-life-leech-iii-summary")).toBeNull();
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Life Leech III" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("reviews %s's Ambush without supplying enemy Full Life or altering previous choices", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "criticalChance",weight: 3 },{ id: "criticalDamageBonus",weight: 2 },{ id: "poisonMagnitude",weight: 3 }],
      supportGemIds: ["supercritical","pinpoint-critical","inexorable-critical-ii","momentum","blindside","blind-ii","malady","poison-iii","fork","pierce-iii","chain-iii","ricochet-ii","nova-projectiles-ii",
        ...(focusSkillId === "gas-arrow" ? ["overabundance-ii"] : [])] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const caution = screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent;
    const previous = Object.fromEntries([...document.querySelectorAll('.skill-supports [id$="-summary"]')].map(el => [el.id,el.textContent]));
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Ambush" }));
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,"ambush"] });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    const note = document.getElementById("support-ambush-summary")!.textContent!;
    for (const text of ["100% more Critical Hit Chance only against enemies on Full Life", "5% becomes 10% before caps", "not player Full Life",
      "Opening hits may qualify while the target is still at Full Life", "later hits must satisfy that condition again", "Ongoing Poison is not a Hit",
      "opener critical state is not assumed to carry into them", "checkbox holds that condition fixed throughout the calculation",
      "not real burst/cloud Hits or proof of live-game inheritance", "fixed Inexorable buildup does not simulate resets", "No enemy Full Life or critical uptime",
      "No added Mana multiplier; other supports still cost Mana", "Manual weights and route scores stay unchanged"]) expect(note).toContain(text);
    for (const [id,text] of Object.entries(previous)) expect(document.getElementById(id)!.textContent).toBe(text);
    expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toBe(caution);
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    expect(screen.queryByRole("checkbox", { name: "Enemy Full Life" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Ambush" }));
    const removed = onChange.mock.calls.at(-1)![0];
    expect(removed).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={removed} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-ambush-summary")).toBeNull();
    rerender(<SkillPreferencePresetControls settings={removed} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Ambush" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("reviews %s's Pinpoint trade-offs and keeps it when changing Inexorable tiers", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "criticalChance",weight: 3 },{ id: "criticalDamageBonus",weight: 2 },{ id: "poisonMagnitude",weight: 3 }],
      supportGemIds: ["supercritical","inexorable-critical-i","momentum","blindside","blind-ii","malady","poison-iii","fork","pierce-iii","chain-iii","ricochet-ii","nova-projectiles-ii",
        ...(focusSkillId === "gas-arrow" ? ["overabundance-ii"] : [])] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const caution = screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent;
    const previous = Object.fromEntries([...document.querySelectorAll('.skill-supports [id$="-summary"]')].filter(el => el.id !== "support-inexorable-critical-i-summary").map(el => [el.id,el.textContent]));
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Pinpoint Critical" }));
    let selected = onChange.mock.calls.at(-1)![0] as PassiveOptimizationSettings;
    expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,"pinpoint-critical"] });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    const note = document.getElementById("support-pinpoint-critical-summary")!.textContent!;
    for (const text of ["60% more Critical Hit Chance (5% becomes 8%)", "30% less Critical Damage Bonus", "2x critical multiplier becomes 1.7x",
      "1.6 x 0.8", "0.7 x 0.5 = 0.35", "not an additive 80% penalty", "do not simulate how changed crit chance affects Inexorable resets",
      "Maximum buildup and critical uptime are not assumed", "A better average hit need not improve native Poison estimates",
      "No added Mana multiplier; other supports still cost Mana", "Manual weights and route scores stay unchanged"]) expect(note).toContain(text);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Inexorable Critical II" }));
    selected = onChange.mock.calls.at(-1)![0];
    expect(selected.preferences).toEqual(initial.preferences);
    expect(selected.extraPointBudget).toBe(initial.extraPointBudget);
    expect(selected.supportGemIds).not.toContain("inexorable-critical-i");
    expect(selected.supportGemIds).toEqual(expect.arrayContaining(["supercritical","pinpoint-critical","inexorable-critical-ii"]));
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-pinpoint-critical-summary")!.textContent).toBe(note);
    for (const [id,text] of Object.entries(previous)) expect(document.getElementById(id)!.textContent).toBe(text);
    expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toBe(caution);
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Pinpoint Critical" }));
    const removed = onChange.mock.calls.at(-1)![0];
    expect(removed).toEqual({ ...selected,supportGemIds: selected.supportGemIds!.filter(id => id !== "pinpoint-critical") });
    rerender(<SkillPreferencePresetControls settings={removed} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-pinpoint-critical-summary")).toBeNull();
    rerender(<SkillPreferencePresetControls settings={removed} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Pinpoint Critical" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("reviews %s's Inexorable tiers without assuming capped buildup or changing manual state", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "criticalChance",weight: 3 },{ id: "criticalDamageBonus",weight: 2 },{ id: "poisonMagnitude",weight: 3 }],
      supportGemIds: ["supercritical","momentum","blindside","blind-ii","malady","poison-iii","fork","pierce-iii","chain-iii","ricochet-ii","nova-projectiles-ii",
        ...(focusSkillId === "gas-arrow" ? ["overabundance-ii"] : [])] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const caution = screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent;
    const previousNotes = Object.fromEntries([...document.querySelectorAll('.skill-supports [id$="-summary"]')].map(el => [el.id,el.textContent]));
    let selected: PassiveOptimizationSettings = initial;
    for (const support of poisonBowInexorableSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${support.name}` }));
      selected = onChange.mock.calls.at(-1)![0];
      expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,support.id] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${support.id}-summary`)!.textContent!;
      for (const text of [`${support.chancePerSecond}% increased Critical Hit Chance each second`, `up to ${support.chanceCap}%`,
        "Buildup resets whenever a skill supported by Inexorable Critical critically hits", "Poison damage itself is not a critical Hit or a reset event",
        "PoB defaults to ten elapsed seconds", "Maximum buildup and critical uptime are not assumed", "20% higher Mana cost before rounding applies even at zero buildup",
        "Manual weights and route scores stay unchanged"]) expect(note).toContain(text);
      if (support.lessBonusCap) expect(note).toContain("extra critical damage component, not total damage; more buildup is not always better");
      for (const [id,text] of Object.entries(previousNotes)) expect(document.getElementById(id)!.textContent).toBe(text);
      for (const tier of poisonBowInexorableSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${tier.name}` })).toHaveProperty("checked",tier.id === support.id);
      expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toBe(caution);
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    }
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Inexorable Critical II" }));
    selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-inexorable-critical-ii-summary")).toBeNull();
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled />);
    for (const tier of poisonBowInexorableSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${tier.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("reviews %s's Supercritical without assuming critical uptime or changing manual crit weights", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId,
      preferences: [{ id: "criticalChance", weight: 3 }, { id: "criticalDamageBonus", weight: 2 }, { id: "poisonMagnitude", weight: 3 }],
      supportGemIds: ["momentum", "blindside", "blind-ii", "malady", "poison-iii", "fork", "pierce-iii", "chain-iii", "ricochet-ii", "nova-projectiles-ii",
        ...(focusSkillId === "gas-arrow" ? ["overabundance-ii"] : [])] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const caution = screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent;
    const originalNotes = Object.fromEntries([...document.querySelectorAll('.skill-supports [id$="-summary"]')].map(el => [el.id,el.textContent]));
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Supercritical" }));
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, "supercritical"] });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    const note = document.getElementById("support-supercritical-summary")!.textContent!;
    for (const text of ["100% increased Critical Damage Bonus, with 20% less Critical Hit Chance", "extra critical damage component, not total damage",
      "5% becomes 4%", "sustained-application assumptions", "not real burst/cloud Hits or proof of live-game critical inheritance",
      "A net benefit or critical uptime is not assumed", "cannot restore prohibited critical hits", "No added Mana multiplier", "Manual weights and route scores stay unchanged"])
      expect(note).toContain(text);
    for (const [id,text] of Object.entries(originalNotes)) expect(document.getElementById(id)!.textContent).toBe(text);
    expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toBe(caution);
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Supercritical" }));
    const removed = onChange.mock.calls.at(-1)![0];
    expect(removed).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={removed} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-supercritical-summary")).toBeNull();
    rerender(<SkillPreferencePresetControls settings={removed} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Supercritical" }).matches(":disabled")).toBe(true);
  });

  it("reviews Gas Arrow's cloud limit tiers and restores the standalone note after removing Nova II", () => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId: "gas-arrow",
      preferences: [{ id: "physicalDamage", weight: 2 }, { id: "chaosDamage", weight: 1 }, { id: "poisonMagnitude", weight: 3 }],
      supportGemIds: ["momentum", "malady", "poison-iii", "fork", "pierce-iii", "chain-iii", "ricochet-ii", "salvo", "nova-projectiles-i", "prolonged-duration-ii"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const caution = screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent;
    const click = (name: string) => {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${name}` }));
      const next = onChange.mock.calls.at(-1)![0] as PassiveOptimizationSettings;
      rerender(<SkillPreferencePresetControls settings={next} onChange={onChange} disabled={false} />);
      expect(next.preferences).toEqual(initial.preferences);
      expect(next.extraPointBudget).toBe(initial.extraPointBudget);
      expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toBe(caution);
      expect(document.getElementById("support-chain-iii-summary")!.textContent).toContain("While always-Pierce is active");
      expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("Malady is selected");
      expect(document.getElementById("support-momentum-summary")!.textContent).toContain("Uptime is not assumed");
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
      return next;
    };
    for (const support of poisonBowOverabundanceSupportFixtures) {
      const selected = click(support.name);
      expect(selected.supportGemIds).toEqual([...initial.supportGemIds!, support.id]);
      const note = document.getElementById(`support-${support.id}-summary`)!.textContent!;
      for (const text of ["+1 to the cloud Limit (base six to seven)", `${support.lessDuration}% less skill-effect duration`,
        "separate two-second Poison duration is unchanged", "not current cloud count, extra Poison stacks or a damage multiplier",
        "No added Mana multiplier", "Manual weights and route scores stay unchanged"]) expect(note).toContain(text);
      for (const tier of poisonBowOverabundanceSupportFixtures) expect((screen.getByRole("checkbox", { name: `Use ${tier.name}` }) as HTMLInputElement).checked).toBe(tier.id === support.id);
    }
    const standalone = document.getElementById("support-overabundance-ii-summary")!.textContent;
    let selected = click("Nova Projectiles II");
    expect(selected.supportGemIds).not.toContain("salvo");
    expect(selected.supportGemIds).not.toContain("nova-projectiles-i");
    expect(document.getElementById("support-overabundance-ii-summary")!.textContent).toContain("not validated extra cooldown uses or extra Poison applications");
    selected = click("Nova Projectiles II");
    expect(document.getElementById("support-overabundance-ii-summary")!.textContent).toBe(standalone);
    selected = click("Overabundance II");
    expect(selected.supportGemIds).not.toContain("overabundance-ii");
    expect(document.getElementById("support-overabundance-ii-summary")).toBeNull();
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled />);
    for (const tier of poisonBowOverabundanceSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${tier.name}` }).matches(":disabled")).toBe(true);
  });

  it("never offers Overabundance for Poisonburst and clears Gas-only supports on a focus change without changing weights", () => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId: "gas-arrow", supportGemIds: ["overabundance-ii", "momentum"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    expect(screen.getByRole("checkbox", { name: "Use Overabundance II" })).toHaveProperty("checked", true);
    selectPickerOption(screen.getByLabelText("Skill"), "poisonburst-arrow");
    const changed = onChange.mock.calls.at(-1)![0];
    expect(changed).toEqual({ ...initial, focusSkillId: "poisonburst-arrow", supportGemIds: undefined });
    rerender(<SkillPreferencePresetControls settings={changed} onChange={onChange} disabled={false} />);
    for (const tier of poisonBowOverabundanceSupportFixtures) expect(screen.queryByRole("checkbox", { name: `Use ${tier.name}` })).toBeNull();
    expect(screen.getByRole("checkbox", { name: "Use Momentum" })).toHaveProperty("checked", false);
    expect(document.getElementById("support-overabundance-ii-summary")).toBeNull();
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("reviews %s's conditional Momentum without enabling uptime or changing manual state", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "physicalDamage",weight: 2 },{ id: "chaosDamage",weight: 1 },{ id: "poisonMagnitude",weight: 3 }],
      supportGemIds: ["mobility","deliberation","malady","poison-iii","fork","pierce-iii","chain-iii","ricochet-ii","salvo","nova-projectiles-i"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const caution = screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent;
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Momentum" }));
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,"momentum"] });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    const note = document.getElementById("support-momentum-summary")!.textContent!;
    for (const text of ["40% more Damage only if you move 2 metres", "teleportation does not count", "Uptime is not assumed",
      "eligible pre-mitigation Poison source once, not again as a separate Poison multiplier", "20% higher Mana cost before rounding applies even when the damage condition is inactive",
      "Mobility and Deliberation do not automatically satisfy the distance condition", "Manual weights and route scores stay unchanged"])
      expect(note).toContain(text);
    expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toBe(caution);
    expect(document.getElementById("support-chain-iii-summary")!.textContent).toContain("While always-Pierce is active");
    expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("Malady is selected");
    expect(document.getElementById("support-salvo-summary")!.textContent).toContain("zero Seal timer is missing modeling");
    for (const name of ["Mobility","Deliberation","Salvo","Nova Projectiles I"]) expect((screen.getByRole("checkbox", { name: `Use ${name}` }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Momentum" }));
    const removed = onChange.mock.calls.at(-1)![0];
    expect(removed).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={removed} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-momentum-summary")).toBeNull();
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    rerender(<SkillPreferencePresetControls settings={removed} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Momentum" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("reviews %s's Salvo limits and replaces only conflicting delivery supports", focusSkillId => {
    const onChange = vi.fn();
    const peers = ["malady","poison-iii","fork","pierce-iii","chain-iii","ricochet-ii"];
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "physicalDamage",weight: 2 },{ id: "chaosDamage",weight: 1 },{ id: "poisonMagnitude",weight: 3 }],
      supportGemIds: [...peers,"nova-projectiles-i","multishot-ii"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const caution = screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent;
    const click = (name: string) => {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${name}` }));
      const next = onChange.mock.calls.at(-1)![0] as PassiveOptimizationSettings;
      rerender(<SkillPreferencePresetControls settings={next} onChange={onChange} disabled={false} />);
      expect(next.preferences).toEqual(initial.preferences);
      expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toBe(caution);
      expect(document.getElementById("support-chain-iii-summary")!.textContent).toContain("While always-Pierce is active");
      expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("Malady is selected");
      expect(document.getElementById("support-ricochet-ii-summary")!.textContent).toContain("suitable walls, targets and repeat hits are not supplied");
      return next;
    };
    let next = click("Salvo");
    expect(next.supportGemIds).toEqual([...peers,"nova-projectiles-i","salvo"]);
    const note = document.getElementById("support-salvo-summary")!.textContent!;
    for (const text of ["gain a Seal each second, up to six", "+1 Projectile per Seal", "fired in random directions", "maximum Seals and extra hits are not assumed",
      "zero Seal timer is missing modeling, not instant gain", "max-Seals toggle does not establish a damage bonus", "No added Mana multiplier, cooldown or damage/speed penalty"])
      expect(note).toContain(text);
    expect((screen.getByRole("checkbox", { name: "Use Multishot II" }) as HTMLInputElement).checked).toBe(false);
    next = click("Nova Projectiles II");
    expect(next.supportGemIds).toEqual([...peers,"nova-projectiles-ii"]);
    expect(document.getElementById("support-salvo-summary")).toBeNull();
    next = click("Salvo");
    expect(next.supportGemIds).toEqual([...peers,"salvo"]);
    expect(document.getElementById("support-nova-projectiles-ii-summary")).toBeNull();
    next = click("Multishot I");
    expect(next.supportGemIds).toEqual([...peers,"multishot-i"]);
    click("Salvo");
    next = click("Salvo");
    expect(next.supportGemIds).toEqual(peers);
    expect(document.getElementById("support-salvo-summary")).toBeNull();
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    rerender(<SkillPreferencePresetControls settings={next} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Salvo" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("switches %s's Ricochet tier without supplying terrain or changing manual state", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "physicalDamage",weight: 2 },{ id: "chaosDamage",weight: 1 },{ id: "poisonMagnitude",weight: 3 }],
      supportGemIds: ["malady","poison-iii","fork","pierce-iii","chain-iii","nova-projectiles-ii"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const caution = screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent;
    let selected: PassiveOptimizationSettings = initial;
    for (const support of poisonBowRicochetSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${support.name}` }));
      selected = onChange.mock.calls.at(-1)![0];
      expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,support.id] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${support.id}-summary`)!.textContent!;
      for (const text of [`${support.chance}% chance`,"suitable walls, targets and repeat hits are not supplied", "not ordinary Chain count or Poison chance",
        "No extra contacts, Poison applications, stacks or uptime are credited", "No added damage/speed penalty, cooldown or Mana multiplier",
        "Manual weights and route scores stay unchanged"])
        expect(note).toContain(text);
      for (const other of poisonBowRicochetSupportFixtures) expect((screen.getByRole("checkbox", { name: `Use ${other.name}` }) as HTMLInputElement).checked).toBe(other.id === support.id);
      expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toBe(caution);
      expect(document.getElementById("support-chain-iii-summary")!.textContent).toContain("While always-Pierce is active");
      expect(document.getElementById("support-nova-projectiles-ii-summary")!.textContent).toContain("eight-second base cooldown");
      expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("Malady is selected");
    }
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Ricochet II" }));
    selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    for (const support of poisonBowRicochetSupportFixtures) expect(document.getElementById(`support-${support.id}-summary`)).toBeNull();
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled />);
    for (const support of poisonBowRicochetSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${support.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("enforces %s's two Nova families while preserving legal Multishot pairing", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "physicalDamage",weight: 2 },{ id: "chaosDamage",weight: 1 },{ id: "poisonMagnitude",weight: 3 }],
      supportGemIds: ["malady","poison-iii","fork","pierce-iii","chain-iii"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const caution = screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent;
    const click = (name: string) => {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${name}` }));
      const next = onChange.mock.calls.at(-1)![0] as PassiveOptimizationSettings;
      rerender(<SkillPreferencePresetControls settings={next} onChange={onChange} disabled={false} />);
      expect(next.preferences).toEqual(initial.preferences);
      expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toBe(caution);
      expect(document.getElementById("support-chain-iii-summary")!.textContent).toContain("While always-Pierce is active");
      expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("Malady is selected");
      return next;
    };
    click("Nova Projectiles I");
    expect(document.getElementById("support-nova-projectiles-i-summary")!.textContent).toContain("no added projectiles, damage penalty, cooldown or Mana multiplier");
    let next = click("Multishot II");
    expect(next.supportGemIds).toEqual([...initial.supportGemIds!,"nova-projectiles-i","multishot-ii"]);
    next = click("Nova Projectiles II");
    expect(next.supportGemIds).toEqual([...initial.supportGemIds!,"nova-projectiles-ii"]);
    expect((screen.getByRole("checkbox", { name: "Use Multishot II" }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole("checkbox", { name: "Use Nova Projectiles I" }) as HTMLInputElement).checked).toBe(false);
    const note = document.getElementById("support-nova-projectiles-ii-summary")!.textContent!;
    for (const text of ["+6 Projectiles","50% less Damage","eight-second base cooldown","replaces Nova I and Multishot, not stacks them",
      "Circular delivery is not guaranteed extra contacts", "Manual weights and route scores stay unchanged"])
      expect(note).toContain(text);
    next = click("Multishot I");
    expect(next.supportGemIds).toEqual([...initial.supportGemIds!,"multishot-i"]);
    expect(document.getElementById("support-nova-projectiles-ii-summary")).toBeNull();
    next = click("Nova Projectiles I");
    expect(next.supportGemIds).toEqual([...initial.supportGemIds!,"multishot-i","nova-projectiles-i"]);
    click("Multishot I");
    next = click("Nova Projectiles I");
    expect(next).toEqual(initial);
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    rerender(<SkillPreferencePresetControls settings={next} onChange={onChange} disabled />);
    for (const support of poisonBowNovaSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${support.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("switches %s's Multishot tier without crediting contacts or changing manual state", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "physicalDamage",weight: 2 },{ id: "chaosDamage",weight: 1 },{ id: "poisonMagnitude",weight: 3 }],
      supportGemIds: ["rapid-attacks-ii","malady","poison-iii","fork","pierce-iii","chain-iii"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const caution = screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent;
    let selected: PassiveOptimizationSettings = initial;
    for (const support of poisonBowMultishotSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${support.name}` }));
      selected = onChange.mock.calls.at(-1)![0];
      expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,support.id] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${support.id}-summary`)!.textContent!;
      for (const text of ["+2 Projectiles",`${support.lessDamage}% less Damage`,"20% less Skill Speed","No extra hits, Poison stacks or cloud coverage are credited",
        "not Poison tick speed or duration","No added Mana cost multiplier","Manual weights and route scores stay unchanged"])
        expect(note).toContain(text);
      for (const other of poisonBowMultishotSupportFixtures) expect((screen.getByRole("checkbox", { name: `Use ${other.name}` }) as HTMLInputElement).checked).toBe(other.id === support.id);
      expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toBe(caution);
      expect(document.getElementById("support-chain-iii-summary")!.textContent).toContain("While always-Pierce is active");
      expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("Malady is selected");
    }
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Multishot II" }));
    selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    for (const support of poisonBowMultishotSupportFixtures) expect(document.getElementById(`support-${support.id}-summary`)).toBeNull();
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled />);
    for (const support of poisonBowMultishotSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${support.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("switches %s's Chain tier and restores priority warnings without changing manual state", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "physicalDamage",weight: 2 },{ id: "chaosDamage",weight: 1 },{ id: "poisonMagnitude",weight: 3 }],
      supportGemIds: ["chaos-attunement","withering-touch","malady","poison-iii","longshot-ii","close-combat-ii","corrosion","exploit-weakness","fork","pierce-iii"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const caution = screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent;
    let selected: PassiveOptimizationSettings = initial;
    for (const support of poisonBowChainSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${support.name}` }));
      selected = onChange.mock.calls.at(-1)![0];
      expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,support.id] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${support.id}-summary`)!.textContent!;
      for (const text of [`${support.lessHit}% less Hit Damage`,"applies before any chain occurs","source is reduced once, not again as a separate Poison penalty",
        "No added Mana cost multiplier","No repeat hits, extra contacts, Poison applications or uptime are assumed",
        "Splitting, Piercing and Forking take priority over Chaining","While always-Pierce is active"])
        expect(note).toContain(text);
      for (const other of poisonBowChainSupportFixtures) expect((screen.getByRole("checkbox", { name: `Use ${other.name}` }) as HTMLInputElement).checked).toBe(other.id === support.id);
      expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toBe(caution);
      expect(document.getElementById("support-fork-summary")!.textContent).toContain("Fork and Pierce III are selected");
      expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("Malady is selected");
      expect(document.getElementById("support-longshot-ii-summary")!.textContent).toContain("their damage bonuses do not overlap");
      expect(document.getElementById("support-corrosion-summary")!.textContent).toContain("Incompatible pair selected");
    }
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Pierce III" }));
    selected = onChange.mock.calls.at(-1)![0];
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-chain-iii-summary")!.textContent).toContain("Projectile priority:");
    expect(document.getElementById("support-chain-iii-summary")!.textContent).not.toContain("While always-Pierce is active");
    expect(document.getElementById("support-fork-summary")!.textContent).not.toContain("Fork and Pierce III are selected");
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Fork" }));
    selected = onChange.mock.calls.at(-1)![0];
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-chain-iii-summary")!.textContent).not.toContain("Projectile priority:");
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Pierce I" }));
    selected = onChange.mock.calls.at(-1)![0];
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-chain-iii-summary")!.textContent).toContain("Projectile priority:");
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Chain III" }));
    selected = onChange.mock.calls.at(-1)![0];
    expect(selected.preferences).toEqual(initial.preferences);
    expect(selected.supportGemIds).toContain("pierce-i");
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    for (const support of poisonBowChainSupportFixtures) expect(document.getElementById(`support-${support.id}-summary`)).toBeNull();
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled />);
    for (const support of poisonBowChainSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${support.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("selects %s's Fork and reverses paired Pierce warnings without changing manual state", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(),focusSkillId,
      preferences: [{ id: "physicalDamage",weight: 2 },{ id: "chaosDamage",weight: 1 },{ id: "poisonMagnitude",weight: 3 }],
      supportGemIds: ["chaos-attunement","withering-touch","malady","poison-iii","longshot-ii","close-combat-ii","corrosion","exploit-weakness"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const caution = screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent;
    fireEvent.click(screen.getByRole("checkbox", { name: `Use ${poisonBowForkSupportFixture.name}` }));
    const forkOnly = onChange.mock.calls.at(-1)![0];
    expect(forkOnly).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,"fork"] });
    let selected = forkOnly;
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    for (const text of ["30% less Damage applies after Forking, not before it","not twice the Poison DPS","10% higher Mana cost before rounding",
      "No extra contacts, Poison applications or uptime are assumed","not as a second Poison penalty"])
      expect(document.getElementById("support-fork-summary")!.textContent).toContain(text);
    for (const pierce of poisonBowPierceSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${pierce.name}` }));
      selected = onChange.mock.calls.at(-1)![0];
      expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,"fork",pierce.id] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      for (const id of ["fork",pierce.id]) {
        const note = document.getElementById(`support-${id}-summary`)!.textContent!;
        expect(note).toContain(pierce.tier === 3 ? "piercing enemy collisions cannot also Fork" : "A pierced enemy does not also trigger Fork on that collision");
        expect(note).toContain("Both selections and Fork's Mana multiplier are retained");
      }
      expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toBe(caution);
      expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("Malady is selected");
      expect(document.getElementById("support-longshot-ii-summary")!.textContent).toContain("their damage bonuses do not overlap");
      expect(document.getElementById("support-corrosion-summary")!.textContent).toContain("Incompatible pair selected");
    }
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Fork" }));
    selected = onChange.mock.calls.at(-1)![0];
    expect(selected.supportGemIds).toEqual([...initial.supportGemIds!,"pierce-iii"]);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-pierce-iii-summary")!.textContent).not.toContain("Fork and Pierce III are selected");
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Fork" }));
    selected = onChange.mock.calls.at(-1)![0];
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-fork-summary")!.textContent).toContain("Fork and Pierce III are selected");
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Pierce III" }));
    selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual(forkOnly);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-fork-summary")!.textContent).not.toContain("Fork and Pierce");
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Fork" }));
    selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-fork-summary")).toBeNull();
    rerender(<SkillPreferencePresetControls settings={forkOnly} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Fork" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("switches %s's Pierce tier without stacking families or changing manual state", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId,
      preferences: [{ id: "physicalDamage",weight: 2 }, { id: "chaosDamage",weight: 1 }, { id: "poisonMagnitude",weight: 3 }],
      supportGemIds: ["chaos-attunement","withering-touch","malady","poison-iii","longshot-ii","close-combat-ii","corrosion","exploit-weakness"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const caution = screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent;
    let selected = initial;
    for (const support of poisonBowPierceSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${support.name}` }));
      selected = onChange.mock.calls.at(-1)![0];
      expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds!,support.id] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${support.id}-summary`)!.textContent!;
      expect(note).toContain("No extra contacts, Poison applications or uptime are assumed");
      expect(note).toContain("No added Mana cost multiplier");
      expect(note).toContain(support.tier === 2 ? "without a damage penalty" : "not a second Poison penalty");
      for (const other of poisonBowPierceSupportFixtures) expect((screen.getByRole("checkbox", { name: `Use ${other.name}` }) as HTMLInputElement).checked).toBe(other.id === support.id);
      expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toBe(caution);
      expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("Malady is selected");
      expect(document.getElementById("support-longshot-ii-summary")!.textContent).toContain("their damage bonuses do not overlap");
      expect(document.getElementById("support-corrosion-summary")!.textContent).toContain("Incompatible pair selected");
      expect(document.getElementById("support-withering-touch-summary")!.textContent).toContain("no stacks or uptime are assumed");
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    }
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Pierce III" }));
    const removed = onChange.mock.calls.at(-1)![0];
    expect(removed).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={removed} onChange={onChange} disabled={false} />);
    for (const support of poisonBowPierceSupportFixtures) expect(document.getElementById(`support-${support.id}-summary`)).toBeNull();
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled />);
    for (const support of poisonBowPierceSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${support.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("selects %s's Withering Touch without assuming stacks or overwriting state", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId,
      preferences: [{ id: "physicalDamage", weight: 2 }, { id: "chaosDamage", weight: 1 }, { id: "poisonMagnitude", weight: 3 }],
      supportGemIds: ["chaos-attunement", "malady", "poison-iii", "longshot-ii", "close-combat-ii", "corrosion", "exploit-weakness"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    const caution = screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent;
    fireEvent.click(screen.getByRole("checkbox", { name: `Use ${poisonBowWitheringTouchSupportFixture.name}` }));
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, "withering-touch"] });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    const note = document.getElementById("support-withering-touch-summary")!.textContent!;
    for (const text of ["25% less Damage", "Actual Chaos hit damage is required", "cannot apply Wither on Hit", "adds no Chaos damage",
      "no stacks or uptime are assumed", "No added Mana cost multiplier", "Manual weights and route scores stay unchanged"])
      expect(note).toContain(text);
    expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toBe(caution);
    expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("Malady is selected");
    expect(document.getElementById("support-longshot-ii-summary")!.textContent).toContain("their damage bonuses do not overlap");
    expect(document.getElementById("support-corrosion-summary")!.textContent).toContain("Incompatible pair selected");
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Withering Touch" }));
    const removed = onChange.mock.calls.at(-1)![0];
    expect(removed).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={removed} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-withering-touch-summary")).toBeNull();
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Withering Touch" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("selects %s's Chaos Attunement with trade-off notes and a reversible mixed-source caution", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId,
      preferences: [{ id: "physicalDamage", weight: 2 }, { id: "chaosDamage", weight: 1 }, { id: "poisonMagnitude", weight: 3 }],
      supportGemIds: ["malady", "poison-iii", "efficiency-ii", "close-combat-ii", "longshot-ii", "corrosion", "exploit-weakness", "chaos-mastery"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toContain("The Chaos tag does not add Chaos");
    fireEvent.click(screen.getByRole("checkbox", { name: `Use ${poisonBowChaosAttunementSupportFixture.name}` }));
    let current = onChange.mock.calls.at(-1)![0];
    expect(current).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, "chaos-attunement"] });
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    const note = document.getElementById("support-chaos-attunement-summary")!.textContent!;
    for (const text of ["Gain 25% of Damage as Extra Chaos Damage", "50% less Physical, Fire, Cold and Lightning Damage",
      "not conversion or 25% more Poison", "Poison-source value falls despite higher arrow average hits", "20% higher Mana cost",
      focusSkillId === "gas-arrow" ? "neither Poison chance nor ignition/detonation" : "distinct from the no-hit burst focus"]) expect(note).toContain(text);
    const caution = screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent!;
    expect(caution).toContain("Chaos Damage can scale that portion");
    expect(caution).toContain("not the remaining Physical source or all Poison damage");
    expect(caution).not.toContain("The Chaos tag does not add Chaos");
    expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("Malady is selected");
    expect(document.getElementById("support-longshot-ii-summary")!.textContent).toContain("their damage bonuses do not overlap");
    for (const id of ["corrosion", "exploit-weakness"]) expect(document.getElementById(`support-${id}-summary`)!.textContent).toContain("Incompatible pair selected");
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    current = onChange.mock.calls.at(-1)![0];
    expect(current.preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Chaos Attunement" }));
    current = onChange.mock.calls.at(-1)![0];
    expect(current.supportGemIds).toEqual(initial.supportGemIds);
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-chaos-attunement-summary")).toBeNull();
    expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toContain("The Chaos tag does not add Chaos");
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Chaos Attunement" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("selects %s's Chaos Mastery with component/level/cost notes without overwriting manual priorities", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId,
      preferences: [{ id: "attackDamage", weight: 1 }, { id: "poisonMagnitude", weight: 3 }, { id: "areaOfEffect", weight: 2 }],
      supportGemIds: ["malady", "poison-iii", "efficiency-ii", "close-combat-ii", "longshot-ii", "corrosion", "exploit-weakness"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: `Use ${poisonBowChaosMasterySupportFixture.name}` }));
    let current = onChange.mock.calls.at(-1)![0];
    expect(current).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, "chaos-mastery"] });
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    const note = document.getElementById("support-chaos-mastery-summary")!.textContent!;
    for (const text of ["+1 level to the supported Chaos skill", "not a blanket Chaos Damage or Poison-magnitude multiplier",
      "No separate Mana multiplier, but the higher-level skill can cost more Mana", "no fixed damage percentage is applied",
      "not real burst/cloud hits or Full DPS", "Poison chance, duration, magnitude and stacks stay unchanged in reviewed cases",
      focusSkillId === "gas-arrow" ? "Mana 62 -> 67" : "Mana 38 -> 41",
      focusSkillId === "gas-arrow" ? "conditional Fire-explosion damage can rise, not just Chaos damage" : "increased burst radius"]) expect(note).toContain(text);
    expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("Malady is selected");
    expect(document.getElementById("support-longshot-ii-summary")!.textContent).toContain("their damage bonuses do not overlap");
    for (const id of ["corrosion", "exploit-weakness"]) expect(document.getElementById(`support-${id}-summary`)!.textContent).toContain("Incompatible pair selected");
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    current = onChange.mock.calls.at(-1)![0];
    expect(current.preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Chaos Mastery" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, supportGemIds: initial.supportGemIds });
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Chaos Mastery" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("shows %s's Exploit Weakness context and reversible Corrosion incompatibility without deleting selections", focusSkillId => {
    const onChange = vi.fn();
    const links = ["malady", "poison-iii", "efficiency-ii", "close-combat-ii", "longshot-ii"];
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId,
      preferences: [{ id: "attackDamage", weight: 1 }, { id: "poisonMagnitude", weight: 3 }, { id: "armourBreakAmount", weight: 2 }],
      supportGemIds: [...links, "corrosion"] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    const change = (name: string) => {
      fireEvent.click(screen.getByRole("checkbox", { name }));
      current = onChange.mock.calls.at(-1)![0];
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    };
    change(`Use ${poisonBowExploitWeaknessSupportFixture.name}`);
    expect(current).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, "exploit-weakness"] });
    for (const id of ["exploit-weakness", "corrosion"]) {
      const note = document.getElementById(`support-${id}-summary`)!.textContent!;
      expect(note).toContain("Incompatible pair selected");
      expect(note).toContain("Corrosion is ignored in either link order");
      expect(note).toContain("not treated as a valid loadout");
    }
    const note = document.getElementById("support-exploit-weakness-summary")!.textContent!;
    for (const text of ["40% more Damage against enemies with Fully Broken Armour", "Partial Armour Break does not activate it",
      "supported skill cannot Break Armour", "not Poison magnitude or a second multiplier", "30% higher Mana cost even without Fully Broken Armour",
      focusSkillId === "gas-arrow" ? "Ignition/detonation is not supplied" : "Poison chance and duration are unchanged"]) expect(note).toContain(text);
    change("Use Corrosion");
    expect(document.getElementById("support-exploit-weakness-summary")!.textContent).not.toContain("Incompatible pair selected");
    change("Use Corrosion");
    expect(document.getElementById("support-corrosion-summary")!.textContent).toContain("Incompatible pair selected");
    change("Use Exploit Weakness");
    expect(document.getElementById("support-corrosion-summary")!.textContent).not.toContain("Incompatible pair selected");
    change("Use Exploit Weakness");
    expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("Malady is selected");
    expect(document.getElementById("support-longshot-ii-summary")!.textContent).toContain("their damage bonuses do not overlap");
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    expect(onChange.mock.calls.at(-1)![0].preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Exploit Weakness" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("selects %s's Execute III with separate player/enemy notes and reversible family replacement", focusSkillId => {
    const onChange = vi.fn();
    const links = ["malady", "poison-iii", "efficiency-ii", "close-combat-ii", "longshot-ii"];
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId,
      preferences: [{ id: "attackDamage", weight: 1 }, { id: "poisonMagnitude", weight: 3 }, { id: "accuracy", weight: 2 }],
      supportGemIds: [...links, "execute-ii"] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    const change = (name: string) => {
      fireEvent.click(screen.getByRole("checkbox", { name }));
      current = onChange.mock.calls.at(-1)![0];
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    };
    change(`Use ${poisonBowExecuteThreeSupportFixture.name}`);
    expect(current).toEqual({ ...initial, supportGemIds: [...links, "execute-iii"] });
    for (const name of ["Use Execute I", "Use Execute II"]) expect(screen.getByRole("checkbox", { name })).toHaveProperty("checked", false);
    const note = document.getElementById("support-execute-iii-summary")!.textContent!;
    for (const text of ["against enemies on Low Life", "a separate 30% more while you are on Low Life",
      "Neither condition: no bonus; either alone: 30% more", "both: 1.3 x 1.3 = 1.69", "69% more, not 60%",
      "not Poison magnitude or a second multiplier", "One 10% higher Mana cost applies in all four states, not twice",
      "either condition's uptime are not established", focusSkillId === "gas-arrow" ? "Ignition/detonation is not supplied" : "application chance and Poison duration are unchanged"]) expect(note).toContain(text);
    expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("Malady is selected");
    expect(document.getElementById("support-longshot-ii-summary")!.textContent).toContain("their damage bonuses do not overlap");
    change("Use Execute II");
    expect(current).toEqual(initial);
    expect(document.getElementById("support-execute-iii-summary")).toBeNull();
    expect(document.getElementById("support-execute-ii-summary")!.textContent).toContain("your own Low Life does not activate Execute I/II");
    change("Use Execute III");
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    current = onChange.mock.calls.at(-1)![0];
    expect(current.preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    change("Use Execute III");
    expect(current.supportGemIds).toEqual(links);
    expect(document.getElementById("support-execute-iii-summary")).toBeNull();
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Execute III" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("switches %s's Execute tiers with conditional hit/source/cost notes and preserved priorities", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId,
      preferences: [{ id: "attackDamage", weight: 1 }, { id: "poisonMagnitude", weight: 3 }, { id: "accuracy", weight: 2 }],
      supportGemIds: ["malady", "poison-iii", "efficiency-ii", "close-combat-ii", "longshot-ii"] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    for (const f of poisonBowExecuteSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      current = onChange.mock.calls.at(-1)![0];
      expect(current).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, f.id] });
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      for (const text of [`${f.moreHit}% more damage with Hits against enemies on Low Life`, "your own Low Life does not activate Execute I/II",
        "attack-derived Poison-source estimate under that condition", "not Poison magnitude or a second multiplier", "10% higher Mana cost even outside Low Life",
        "low-life uptime", focusSkillId === "gas-arrow" ? "Ignition/detonation is not supplied" : "application chance and Poison duration are unchanged"]) expect(note).toContain(text);
      expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("Malady is selected");
      expect(document.getElementById("support-longshot-ii-summary")!.textContent).toContain("their damage bonuses do not overlap");
    }
    expect(screen.getByRole("checkbox", { name: "Use Execute I" })).toHaveProperty("checked", false);
    expect(screen.getByRole("checkbox", { name: "Use Execute III" })).toHaveProperty("checked", false);
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    current = onChange.mock.calls.at(-1)![0];
    expect(current.preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Execute II" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, supportGemIds: initial.supportGemIds });
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    for (const f of poisonBowExecuteSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${f.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("pairs %s's Close Combat tiers with Longshot and reverses both warnings without changing priorities", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId,
      preferences: [{ id: "attackDamage", weight: 1 }, { id: "poisonMagnitude", weight: 3 }, { id: "accuracy", weight: 2 }],
      supportGemIds: ["malady", "poison-iii", "efficiency-ii", "longshot-ii"] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    const change = (name: string) => {
      fireEvent.click(screen.getByRole("checkbox", { name }));
      current = onChange.mock.calls.at(-1)![0];
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    };
    for (const f of poisonBowCloseCombatSupportFixtures) {
      change(`Use ${f.name}`);
      expect(current).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, f.id] });
      for (const id of [f.id, "longshot-ii"]) {
        const note = document.getElementById(`support-${id}-summary`)!.textContent!;
        expect(note).toContain("at the same distance their damage bonuses do not overlap");
        expect(note).toContain("Both give zero at 3.5 metres; both Mana cost multipliers still apply");
      }
      expect(document.getElementById(`support-${f.id}-summary`)!.textContent).toContain(`Up to ${f.maxMore}% more Attack Damage at 1 metre or closer`);
      expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("Malady is selected");
    }
    expect(screen.getByRole("checkbox", { name: "Use Close Combat I" })).toHaveProperty("checked", false);
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    change("Use Longshot II");
    expect(document.getElementById("support-close-combat-ii-summary")!.textContent).not.toContain("are selected:");
    change("Use Longshot II");
    expect(document.getElementById("support-close-combat-ii-summary")!.textContent).toContain("are selected:");
    change("Use Close Combat II");
    expect(document.getElementById("support-longshot-ii-summary")!.textContent).not.toContain("are selected:");
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    expect(onChange.mock.calls.at(-1)![0].preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    for (const f of poisonBowCloseCombatSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${f.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("switches %s's Longshot tiers without assuming range uptime or overwriting manual priorities", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId,
      preferences: [{ id: "attackDamage", weight: 1 }, { id: "poisonMagnitude", weight: 3 }, { id: "accuracy", weight: 2 }],
      supportGemIds: ["malady", "poison-iii", "efficiency-ii"] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    for (const f of poisonBowLongshotSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      current = onChange.mock.calls.at(-1)![0];
      expect(current).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, f.id] });
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      expect(note).toContain(`Up to ${f.maxMore}% more Attack Damage at 7 metres and beyond`);
      expect(note).toContain("no bonus at 3.5 metres or closer");
      expect(note).toContain("Longshot adds no Accuracy");
      expect(note).toContain("maximum-range uptime are not simulated");
      expect(note).toContain("20% higher Mana cost even at close range");
      expect(note).toContain(focusSkillId === "gas-arrow" ? "ignition/detonation is not supplied" : "linked Poison duration is unchanged");
      expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("Malady is selected");
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    }
    expect(screen.getByRole("checkbox", { name: "Use Longshot I" })).toHaveProperty("checked", false);
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    current = onChange.mock.calls.at(-1)![0];
    expect(current.preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Longshot II" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, supportGemIds: initial.supportGemIds });
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    for (const f of poisonBowLongshotSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${f.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("selects %s's Heft with maximum-only damage and Mana boundaries while preserving manual priorities", focusSkillId => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId,
      preferences: [{ id: "physicalDamage", weight: 1 }, { id: "poisonMagnitude", weight: 3 }, { id: "skillDuration", weight: 2 }],
      supportGemIds: ["malady", "poison-iii", "efficiency-ii"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: `Use ${poisonBowHeftSupportFixture.name}` }));
    let current = onChange.mock.calls.at(-1)![0];
    expect(current).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, "heft"] });
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    const note = document.getElementById("support-heft-summary")!.textContent!;
    expect(note).toContain("30% more maximum Physical hit damage, not minimum damage or 30% more average/Poison damage");
    expect(note).toContain("Physical Poison-source ceiling, not Poison magnitude");
    expect(note).toContain("20% higher Mana cost before rounding");
    expect(note).toContain("not guaranteed sustain");
    expect(note).toContain(focusSkillId === "gas-arrow" ? "fully converted Fire explosion is unchanged" : "linked Poison duration is unchanged");
    expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("Malady is selected");
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    current = onChange.mock.calls.at(-1)![0];
    expect(current.preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Heft" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, supportGemIds: initial.supportGemIds });
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Heft" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("updates %s's paired chance notes with Malady and restores them on removal without changing manual priorities", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId,
      preferences: [{ id: "poisonChance", weight: 1 }, { id: "bleedingChance", weight: 2 }, { id: "poisonMagnitude", weight: 3 }],
      supportGemIds: ["blindside", "blind-ii", "poison-iii", "bleed-ii", "admixture", "efficiency-ii"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: `Use ${poisonBowMaladySupportFixture.name}` }));
    let current = onChange.mock.calls.at(-1)![0];
    expect(current).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, "malady"] });
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    const note = document.getElementById("support-malady-summary")!.textContent!;
    expect(note).toContain("Swaps base on-hit Poison and Bleeding chance");
    expect(note).toContain("current availability is unverified");
    expect(note).toContain(focusSkillId === "gas-arrow" ? "separate from inherent cloud Poison" : "separate from inherent burst Poison");
    expect(note).toContain("PoB runtime does not calculate the swap");
    expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("60% base chance to Poison contributes to base Bleeding chance instead");
    expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("20% more Poison magnitude remains Poison-only");
    expect(document.getElementById("support-bleed-ii-summary")!.textContent).toContain("75% base chance to inflict Bleeding contributes to base Poison chance instead");
    expect(document.getElementById("support-blind-ii-summary")!.textContent).toContain("Blindside is selected");
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Bleed III" }));
    current = onChange.mock.calls.at(-1)![0];
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    expect(screen.getByRole("checkbox", { name: "Use Bleed II" })).toHaveProperty("checked", false);
    expect(document.getElementById("support-bleed-iii-summary")!.textContent).toContain("100% base chance to inflict Bleeding contributes to base Poison chance instead");
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    current = onChange.mock.calls.at(-1)![0];
    expect(current.preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: `Use ${poisonBowMaladySupportFixture.name}` }));
    const removed = onChange.mock.calls.at(-1)![0];
    expect(removed.supportGemIds).toEqual(current.supportGemIds.filter((id: string) => id !== "malady"));
    rerender(<SkillPreferencePresetControls settings={removed} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-malady-summary")).toBeNull();
    expect(document.getElementById("support-poison-iii-summary")!.textContent).toContain("60% chance to Poison on eligible hits");
    expect(document.getElementById("support-bleed-iii-summary")!.textContent).toContain("100% chance to inflict Bleeding on eligible hits");
    expect(document.getElementById("support-blind-ii-summary")!.textContent).toContain("Blindside is selected");
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: `Use ${poisonBowMaladySupportFixture.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("selects %s's Maim without assuming debuff uptime or changing manual priorities", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId,
      preferences: [{ id: "maimChance", weight: 1 }, { id: "slowMagnitude", weight: 2 }, { id: "poisonMagnitude", weight: 3 }, { id: "evasion", weight: 1 }],
      supportGemIds: ["blindside", "blind-ii", "poison-iii", "efficiency-ii"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: `Use ${poisonBowMaimSupportFixture.name}` }));
    let current = onChange.mock.calls.at(-1)![0];
    expect(current).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, "maim"] });
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    const note = document.getElementById("support-maim-summary")!.textContent!;
    expect(note).toContain("100% chance to Maim on eligible attack hits, not guaranteed contact or uptime");
    expect(note).toContain("30% reduced Movement Speed and 15% reduced Evasion");
    expect(note).toContain(focusSkillId === "gas-arrow" ? "no-hit cloud and its Poison cannot apply Maim" : "no-hit burst and linked Poison cannot apply Maim");
    expect(note).toContain("enemy penalties require explicit Maim configuration");
    expect(note).toContain("no debuff uptime, chase time or boss benefit is assumed");
    expect(document.getElementById("support-blind-ii-summary")!.textContent).toContain("Blindside is selected");
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    current = onChange.mock.calls.at(-1)![0];
    expect(current.preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Maim" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, supportGemIds: initial.supportGemIds });
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Maim" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("switches %s's Bounty tiers without promising Poison kill credit or changing manual charge priorities", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId, preferences: [{ id: "flaskChargesGained", weight: 1 }, { id: "charmChargesGained", weight: 2 },
      { id: "poisonMagnitude", weight: 2 }, { id: "life", weight: 3 }], supportGemIds: ["blindside", "blind-ii", "poison-iii", "efficiency-ii"] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    for (const f of poisonBowBountySupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      current = onChange.mock.calls.at(-1)![0];
      expect(current).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, f.id] });
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      const summary = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      expect(summary).toContain(`${f.moreLife}% more Life Flask, Mana Flask and Charm charges from enemies killed by Hits of the supported skill`);
      expect(summary).toContain("Poison damage-over-time kills are not hit kills");
      expect(summary).toContain(focusSkillId === "gas-arrow" ? "no-hit cloud and its Poison do not supply that killing hit" : "no-hit burst and linked Poison do not supply that killing hit");
      expect(summary).toContain("no kill rate, Flask/Charm uptime or boss sustain is assumed");
      expect(summary).toContain("PoB runtime does not calculate these on-kill rewards");
      expect(document.getElementById("support-blind-ii-summary")!.textContent).toContain("Blindside is selected");
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    }
    expect(screen.getByRole("checkbox", { name: "Use Bounty I" })).toHaveProperty("checked", false);
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    current = onChange.mock.calls.at(-1)![0];
    expect(current.preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Bounty II" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, supportGemIds: initial.supportGemIds });
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    for (const f of poisonBowBountySupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${f.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("puts %s's Blindside prohibition before conditional crit benefits and replaces paired Blind notes without changing weights", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId, preferences: [{ id: "blindChance", weight: 1 }, { id: "criticalChance", weight: 3 },
      { id: "criticalDamageBonus", weight: 2 }, { id: "poisonMagnitude", weight: 2 }], supportGemIds: ["blind-ii", "poison-iii", "culling-strike-ii", "efficiency-ii"] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Blindside" }));
    current = onChange.mock.calls.at(-1)![0];
    expect(current).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, "blindside"] });
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    const summary = document.getElementById("support-blindside-summary")!.textContent!;
    expect(summary.startsWith("Cannot inflict Blind, even with Blind I/II")).toBe(true);
    expect(summary).toContain("Against Blinded enemies only: 15% more Critical Hit Chance and 15% more Critical Damage Bonus");
    expect(summary).toContain("PoB runtime does not enforce the Blind prohibition");
    expect(summary).toContain("20% higher Mana cost before rounding");
    expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toContain("Blindside prevents this supported skill from inflicting Blind");
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    for (const [id, name] of [["blind-i", "Blind I"], ["blind-ii", "Blind II"]]) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${name}` }));
      current = onChange.mock.calls.at(-1)![0];
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      const caution = document.getElementById(`support-${id}-summary`)!.textContent!;
      expect(caution.startsWith("Blindside is selected: this supported skill cannot inflict Blind")).toBe(true);
      expect(caution).toContain("cannot supply Blindside's condition or strengthen a different source's Blind");
      expect(caution).not.toContain("100% chance to Blind");
      expect(current.preferences).toEqual(initial.preferences);
      expect(current.supportGemIds).toContain("blindside");
    }
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    current = onChange.mock.calls.at(-1)![0];
    expect(current.preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Blindside" }));
    current = onChange.mock.calls.at(-1)![0];
    expect(current.supportGemIds).toEqual(["poison-iii", "culling-strike-ii", "efficiency-ii", "blind-ii"]);
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-blindside-summary")).toBeNull();
    expect(document.getElementById("support-blind-ii-summary")!.textContent).toContain("100% chance to Blind");
    expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).not.toContain("Blindside prevents");
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Blindside" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("switches %s's Blind tiers without assuming enemy state or changing manual Blind/Poison priorities", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId, preferences: [{ id: "blindChance", weight: 1 }, { id: "blindEffect", weight: 2 },
      { id: "poisonMagnitude", weight: 2 }, { id: "life", weight: 3 }], supportGemIds: ["poison-iii", "culling-strike-ii", "compressed-duration-ii", "efficiency-ii"] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    for (const f of poisonBowBlindSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      current = onChange.mock.calls.at(-1)![0];
      expect(current).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, f.id] });
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      expect(note).toContain("100% chance to Blind on eligible hits, not guaranteed contact or uptime");
      expect(note).toContain(focusSkillId === "gas-arrow" ? "no-hit cloud and its Poison cannot apply Blind" : "no-hit burst and linked Poison cannot apply Blind");
      expect(note).toContain("enemy ratings, not player ratings or direct Poison damage");
      expect(note).toContain("10% higher Mana cost before rounding");
      expect(note).toContain("no debuff uptime or sustain is assumed");
      if (f.increasedEffect) expect(note).toContain("24% less Accuracy and Evasion without other effect modifiers, not 40% less");
      else expect(note).toContain("Base Blind gives enemies 20% less Accuracy and Evasion");
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    }
    expect(screen.getByRole("checkbox", { name: "Use Blind I" })).toHaveProperty("checked", false);
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    current = onChange.mock.calls.at(-1)![0];
    expect(current.preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Blind II" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, supportGemIds: initial.supportGemIds });
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    for (const f of poisonBowBlindSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${f.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("switches %s's Culling tiers with rarity/hit warnings while preserving other links and manual weights", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId, preferences: [{ id: "poisonMagnitude", weight: 2 }, { id: "attackSpeed", weight: 1 }, { id: "life", weight: 3 }],
      supportGemIds: ["poison-iii", "swift-affliction-ii", "compressed-duration-ii", "efficiency-ii"] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    for (const f of poisonBowCullingSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      current = onChange.mock.calls.at(-1)![0];
      expect(current).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, f.id] });
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      expect(note).toContain("base Life thresholds 10%/5%");
      expect(note).toContain("not Normal/Magic");
      expect(note).toContain("Poison cannot Cull");
      expect(note).toContain(focusSkillId === "gas-arrow" ? "no-hit cloud and its Poison cannot trigger culling" : "no-hit burst and linked Poison cannot trigger culling");
      if (f.thresholdBuff) {
        expect(note).toContain("20% increased threshold for 20 seconds");
        expect(note).toContain("12%/6% without other modifiers, not +20 percentage points");
        expect(note).toContain("PoB runtime does not calculate this conditional bonus");
      }
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    }
    expect(screen.getByRole("checkbox", { name: "Use Culling Strike I" })).toHaveProperty("checked", false);
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    current = onChange.mock.calls.at(-1)![0];
    expect(current.preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Culling Strike II" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, supportGemIds: initial.supportGemIds });
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    for (const f of poisonBowCullingSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${f.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("switches %s's Compressed tiers without changing Swift/Prolonged or manual duration priorities", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId, preferences: [{ id: "skillDuration", weight: 1 }, { id: "poisonDuration", weight: 2 },
      { id: "poisonMagnitude", weight: 2 }, { id: "life", weight: 3 }], supportGemIds: ["swift-affliction-ii", "prolonged-duration-ii", "poison-iii", "efficiency-ii"] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    for (const f of poisonBowCompressedSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      current = onChange.mock.calls.at(-1)![0];
      expect(current).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, f.id] });
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      expect(note).toContain(`${f.lessDuration}% less skill-effect duration, not faster Poison damage`);
      expect(note).toContain("No damage bonus or direct damaging-ailment-duration penalty");
      expect(note).toContain(focusSkillId === "gas-arrow" ? "shortens cloud lifetime, not the outgoing Poison timer" : "shortens the linked burst Poison");
      expect(note).toContain("Separate arrow-hit Poison and Bleeding timers are unchanged");
      expect(note).toContain("not a Poison-damage recommendation");
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    }
    expect(screen.getByRole("checkbox", { name: "Use Compressed Duration I" })).toHaveProperty("checked", false);
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    current = onChange.mock.calls.at(-1)![0];
    expect(current.preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Compressed Duration II" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, supportGemIds: initial.supportGemIds });
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    for (const f of poisonBowCompressedSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${f.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("switches %s's Swift tiers with duration warnings but without intrinsic-DoT priority changes", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId, preferences: [{ id: "skillDuration", weight: 1 }, { id: "poisonDuration", weight: 2 },
      { id: "poisonMagnitude", weight: 2 }, { id: "damageOverTime", weight: 1 }, { id: "life", weight: 3 }], supportGemIds: ["poison-iii", "prolonged-duration-ii", "efficiency-ii"] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    for (const f of poisonBowSwiftSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      current = onChange.mock.calls.at(-1)![0];
      expect(current).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, f.id] });
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      expect(note).toContain("30% more non-ailment DoT, not Poison magnitude");
      expect(note).toContain(`${f.lessDuration}% less skill-effect and damaging-ailment duration in the source`);
      expect(note).toContain(focusSkillId === "gas-arrow" ? "outgoing Poison takes one ailment-duration penalty" : "combines both duration penalties for the linked burst Poison");
      expect(note).toContain("unverified");
      expect(note).toContain("Not a Poison-damage recommendation");
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    }
    expect(screen.getByRole("checkbox", { name: "Use Swift Affliction I" })).toHaveProperty("checked", false);
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    current = onChange.mock.calls.at(-1)![0];
    expect(current.preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Swift Affliction II" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, supportGemIds: initial.supportGemIds });
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    for (const f of poisonBowSwiftSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${f.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("selects %s's Corrosion with explicit compatibility and unmodeled Armour Break boundaries", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId, preferences: [{ id: "poisonMagnitude", weight: 2 }, { id: "armourBreakAmount", weight: 1 },
      { id: "fullyBrokenArmourEffect", weight: 1 }, { id: "armourBreakDuration", weight: 1 }, { id: "life", weight: 3 }],
      supportGemIds: ["poison-iii", "bleed-iii", "admixture", "efficiency-ii"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Corrosion" }));
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, "corrosion"] });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    const note = document.getElementById("support-corrosion-summary")!.textContent!;
    expect(note).toContain("80% of Poison damage, not 80% more Poison DPS");
    expect(note).toContain("Cannot support skills that Consume Fully Broken Armour");
    expect(note).toContain("parent is compatible through its arrow-hit skill");
    expect(note).toContain(focusSkillId === "gas-arrow" ? "cloud still poisons without hitting" : "no-hit burst remains separate");
    expect(note).toContain("zero output is not zero game effect");
    expect(note).toContain("No assumed Fully Broken Armour, Corrosion stacks or uptime");
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    expect(onChange.mock.calls.at(-1)![0].preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Corrosion" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Corrosion" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("switches %s's Bleed tiers without replacing Poison/Admixture or assuming no-hit Bleeding", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId, preferences: [{ id: "poisonMagnitude", weight: 2 }, { id: "bleedingChance", weight: 1 },
      { id: "bleedingMagnitude", weight: 1 }, { id: "life", weight: 3 }], supportGemIds: ["poison-iii", "admixture", "efficiency-ii"] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    for (const f of poisonBowBleedSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      current = onChange.mock.calls.at(-1)![0];
      expect(current).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, f.id] });
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      expect(note).toContain(`${f.chance}% chance to inflict Bleeding on eligible hits`);
      expect(note).toContain(focusSkillId === "gas-arrow" ? "no-hit cloud cannot inflict Bleeding" : "no-hit burst cannot inflict Bleeding");
      expect(note).toContain("contact and uptime are not assumed");
      expect(note).toContain("synthetic source-hit Bleeding fields are not actual burst/cloud Bleeding");
      expect(note).toContain(f.manaMultiplier ? "Higher Mana cost" : "No added Mana cost multiplier");
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    }
    expect(screen.getByRole("checkbox", { name: "Use Bleed I" })).toHaveProperty("checked", false);
    expect(screen.getByRole("checkbox", { name: "Use Bleed II" })).toHaveProperty("checked", false);
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    expect(onChange.mock.calls.at(-1)![0].preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Bleed III" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    for (const f of poisonBowBleedSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${f.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("selects %s's Admixture independently of Poison III without assuming either enemy condition", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId, preferences: [{ id: "poisonMagnitude", weight: 2 }, { id: "bleedingChance", weight: 1 },
      { id: "bleedingMagnitude", weight: 1 }, { id: "life", weight: 3 }], supportGemIds: ["poison-iii", "deadly-poison-ii", "efficiency-ii"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Admixture" }));
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, "admixture"] });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    const note = document.getElementById("support-admixture-summary")!.textContent!;
    expect(note).toContain("20% more Poison magnitude against Bleeding enemies");
    expect(note).toContain("20% more Bleeding magnitude from supported hits against Poisoned enemies");
    expect(note).toContain("Admixture itself adds neither ailment chance");
    expect(note).toContain("conditional 1.44 multiplier, not an unconditional route-score bonus");
    expect(note).toContain("Enemy conditions and uptime are not assumed");
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    expect(onChange.mock.calls.at(-1)![0].preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Poison II" }));
    expect(onChange.mock.calls.at(-1)![0].supportGemIds).toEqual(["deadly-poison-ii", "efficiency-ii", "admixture", "poison-ii"]);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Admixture" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Admixture" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("switches %s's Poison tiers without assuming Bleeding or editing manual chances", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId, preferences: [{ id: "poisonChance", weight: 1 }, { id: "poisonMagnitude", weight: 2 },
      { id: "bleedingChance", weight: 1 }, { id: "life", weight: 3 }], supportGemIds: ["escalating-poison", "deadly-poison-ii", "efficiency-ii"] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    for (const f of poisonBowPoisonSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      current = onChange.mock.calls.at(-1)![0];
      expect(current).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, f.id] });
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      expect(note).toContain(`${f.chance}% chance to Poison on eligible hits`);
      expect(note).toContain("Inherent burst/cloud Poison does not need this chance");
      if (f.bleedingMagnitudeMore) {
        expect(note).toContain("20% more Poison magnitude only against Bleeding enemies");
        expect(note).toContain("Bleeding and its uptime are not assumed");
      }
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    }
    expect(screen.getByRole("checkbox", { name: "Use Poison I" })).toHaveProperty("checked", false);
    expect(screen.getByRole("checkbox", { name: "Use Poison II" })).toHaveProperty("checked", false);
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    expect(onChange.mock.calls.at(-1)![0].preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Poison III" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    for (const f of poisonBowPoisonSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${f.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("selects %s's Bursting Plague without presenting enemy storage or on-death damage as Poison/boss DPS", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId, preferences: [{ id: "poisonMagnitude", weight: 2 }, { id: "physicalDamage", weight: 1 },
      { id: "areaOfEffect", weight: 1 }, { id: "life", weight: 3 }], supportGemIds: ["escalating-poison", "deadly-poison-ii", "prolonged-duration-ii", "efficiency-ii"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Bursting Plague" }));
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, "bursting-plague"] });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    const note = document.getElementById("support-bursting-plague-summary")!.textContent!;
    expect(note).toContain("20% of that enemy's maximum Life");
    expect(note).toContain("player-owned Physical area hit triggers on that enemy's death");
    expect(note).toContain("PoB does not calculate Plague buildup or burst damage");
    expect(note).toContain("kills, cap saturation and boss uptime are not assumed");
    expect(note).toContain(focusSkillId === "gas-arrow" ? "not Gas Arrow's conditional Fire explosion" : "initial arrow must hit");
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    expect(onChange.mock.calls.at(-1)![0].preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Bursting Plague" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Bursting Plague" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("selects %s's Escalating Poison capacity/duration trade-off without promising stacks or rewriting weights", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId, preferences: [{ id: "poisonDuration", weight: 3 }, { id: "skillDuration", weight: 1 },
      { id: "poisonMagnitude", weight: 2 }, { id: "life", weight: 3 }], supportGemIds: ["prolonged-duration-ii", "deadly-poison-ii", "efficiency-ii", "mobility"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Escalating Poison" }));
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, "escalating-poison"] });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    const note = document.getElementById("support-escalating-poison-summary")!.textContent!;
    expect(note).toContain("One additional Poison stack; 20% less outgoing Poison duration");
    expect(note).toContain("Extra capacity does not guarantee sustained stacks or a damage gain");
    expect(note).toContain(focusSkillId === "gas-arrow" ? "not the four-second cloud lifetime" : "Skill Effect Duration can still scale this linked Poison timer");
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    expect(onChange.mock.calls.at(-1)![0].preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Escalating Poison" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Escalating Poison" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("selects %s's movement supports independently without editing global speed or damage priorities", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId, preferences: [{ id: "movementSpeed", weight: 3 },
      { id: "skillMovementPenaltyReduction", weight: 1 }, { id: "poisonMagnitude", weight: 2 }, { id: "life", weight: 3 }],
      supportGemIds: ["deadly-poison-ii", "efficiency-ii", "rapid-attacks-ii"] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    for (const f of poisonBowMovementSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      current = onChange.mock.calls.at(-1)![0];
      expect(current.preferences).toEqual(initial.preferences);
      expect(current.extraPointBudget).toBe(7);
      expect(current.supportGemIds).toEqual(expect.arrayContaining(initial.supportGemIds!));
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      expect(note).toContain(f.id === "mobility" ? "not global Movement Speed, Attack Speed or Poison-source damage" : "derived Poison source, not Poison Magnitude");
      expect(note).toContain(focusSkillId === "gas-arrow" ? "cloud still poisons without hitting" : "initial arrow must hit");
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    }
    expect(current.supportGemIds).toEqual([...initial.supportGemIds!, "mobility", "deliberation"]);
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    expect(onChange.mock.calls.at(-1)![0].preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Mobility" }));
    const removed = onChange.mock.calls.at(-1)![0];
    expect(removed).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, "deliberation"] });
    rerender(<SkillPreferencePresetControls settings={removed} onChange={onChange} disabled />);
    for (const control of screen.getAllByRole("checkbox")) expect(control.matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("offers %s's Concentrated coverage tradeoff and applies only its explicit area-priority adjustment", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId, preferences: [{ id: "areaOfEffect", weight: 1 }, { id: "poisonMagnitude", weight: 2 },
      { id: "life", weight: 3 }, { id: "fireDamage", weight: 2 }], supportGemIds: ["magnified-area-ii", "deadly-poison-ii", "efficiency-ii"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Concentrated Area" }));
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, "concentrated-area"] });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    const note = document.getElementById("support-concentrated-area-summary")!.textContent!;
    expect(note).toContain("30% more Area Damage; 50% less area, not 50% less radius");
    expect(note).toContain("derived Poison source");
    expect(note).toContain(focusSkillId === "gas-arrow" ? "cloud still poisons without hitting" : "not the initial arrow hit");
    expect(screen.getByRole("list", { name: "Support priority changes" }).textContent).toContain("Area of Effect: Normal -> High");
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    const added = onChange.mock.calls.at(-1)![0];
    expect(added.preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    rerender(<SkillPreferencePresetControls settings={added} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Apply support priorities" }));
    const applied = onChange.mock.calls.at(-1)![0];
    expect(applied.preferences).toEqual(added.preferences.map((p: { id: string; weight: number }) => p.id === "areaOfEffect" ? { ...p, weight: 2 } : p));
    expect(applied.extraPointBudget).toBe(7);
    expect(applied.supportGemIds).toEqual(added.supportGemIds);
    rerender(<SkillPreferencePresetControls settings={applied} onChange={onChange} disabled={false} />);
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Concentrated Area" }));
    const removed = onChange.mock.calls.at(-1)![0];
    expect(removed.preferences).toEqual(applied.preferences);
    expect(removed.supportGemIds).toEqual(initial.supportGemIds);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled />);
    expect(screen.getByRole("button", { name: "Apply support priorities" }).matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("selects %s's Deadly Poison trade-off without hiding the hit/source penalty or rewriting priorities", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId, preferences: [{ id: "poisonMagnitude", weight: 1 }, { id: "attackDamage", weight: 2 },
      { id: "life", weight: 3 }, { id: "fireDamage", weight: 2 }], supportGemIds: ["magnified-area-ii", "prolonged-duration-ii", "efficiency-ii"] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    for (const f of poisonBowDeadlySupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      current = onChange.mock.calls.at(-1)![0];
      expect(current).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, f.id] });
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      expect(note).toContain(`${f.poisonMore}% more Poison magnitude; ${f.hitLess}% less damage with hits`);
      expect(note).toContain("Native PoB also reduces the derived Poison source");
      expect(note).toContain(focusSkillId === "gas-arrow" ? "conditional Fire-explosion hits lose damage" : "initial-arrow hits lose damage");
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
      expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toContain("Fire Damage");
    }
    expect(screen.getByRole("checkbox", { name: "Use Deadly Poison I" })).toHaveProperty("checked", false);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Deadly Poison II" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual(initial);
    rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled />);
    for (const control of screen.getAllByRole("checkbox")) expect(control.matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("selects %s's delivery supports without changing manual weights or the older utility families", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId, preferences: [{ id: "attackSpeed", weight: 1 }, { id: "projectileSpeed", weight: 1 },
      { id: "poisonMagnitude", weight: 2 }, { id: "life", weight: 3 }, { id: "fireDamage", weight: 2 }], supportGemIds: ["magnified-area-ii", "prolonged-duration-ii", "efficiency-ii"] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    for (const f of poisonBowSpeedSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      current = onChange.mock.calls.at(-1)![0];
      expect(current.preferences).toEqual(initial.preferences);
      expect(current.extraPointBudget).toBe(7);
      expect(current.supportGemIds).toEqual(expect.arrayContaining(initial.supportGemIds!));
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${f.id}-summary`)!.textContent!;
      expect(note.toLowerCase()).toContain("priorities stay unchanged");
      expect(note).toContain(f.kind === "attack" ? "not Poison magnitude, tick speed" : "not attack speed or a damage conversion");
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    }
    expect(current.supportGemIds).toEqual([...initial.supportGemIds!, "rapid-attacks-ii", "projectile-acceleration-ii"]);
    expect(screen.getByRole("checkbox", { name: "Use Rapid Attacks I" })).toHaveProperty("checked", false);
    expect(screen.getByRole("checkbox", { name: "Use Projectile Acceleration I" })).toHaveProperty("checked", false);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Projectile Acceleration II" }));
    const removed = onChange.mock.calls.at(-1)![0];
    expect(removed.preferences).toEqual(initial.preferences);
    expect(removed.supportGemIds).toEqual([...initial.supportGemIds!, "rapid-attacks-ii"]);
    rerender(<SkillPreferencePresetControls settings={removed} onChange={onChange} disabled />);
    for (const control of screen.getAllByRole("checkbox")) expect(control.matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("selects %s's reviewed utility supports with separate duration notes and no automatic priority edits", (focusSkillId) => {
    const onChange = vi.fn();
    const current: PassiveOptimizationSettings = { ...settings(), focusSkillId,
      preferences: [{ id: "poisonMagnitude", weight: 1 }, { id: "poisonDuration", weight: 1 }, { id: "skillDuration", weight: 1 }, { id: "life", weight: 3 }, { id: "fireDamage", weight: 2 }] };
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    const list = screen.getByRole("list", { name: `${getSkillPreferencePreset(focusSkillId)!.name} reviewed supports` });
    expect(historicalSupportInputs(list).map((input) => input.getAttribute("aria-label")))
      .toEqual([...poisonBowSupportFixtures, ...poisonBowSpeedSupportFixtures, poisonBowConcentratedSupportFixture, ...poisonBowDeadlySupportFixtures, ...poisonBowMovementSupportFixtures, poisonBowEscalatingSupportFixture, poisonBowBurstingPlagueSupportFixture, ...poisonBowPoisonSupportFixtures, poisonBowAdmixtureSupportFixture, ...poisonBowBleedSupportFixtures, poisonBowCorrosionSupportFixture, ...poisonBowSwiftSupportFixtures, ...poisonBowCompressedSupportFixtures, ...poisonBowCullingSupportFixtures, ...poisonBowBlindSupportFixtures, poisonBowBlindsideSupportFixture, ...poisonBowBountySupportFixtures, poisonBowMaimSupportFixture, poisonBowMaladySupportFixture, poisonBowHeftSupportFixture, ...poisonBowLongshotSupportFixtures, ...poisonBowCloseCombatSupportFixtures, ...poisonBowExecuteSupportFixtures, poisonBowExecuteThreeSupportFixture, poisonBowExploitWeaknessSupportFixture, poisonBowChaosMasterySupportFixture, poisonBowChaosAttunementSupportFixture, poisonBowWitheringTouchSupportFixture, ...poisonBowPierceSupportFixtures, poisonBowForkSupportFixture, ...poisonBowChainSupportFixtures, ...poisonBowMultishotSupportFixtures, ...poisonBowNovaSupportFixtures, ...poisonBowRicochetSupportFixtures, poisonBowSalvoSupportFixture, poisonBowMomentumSupportFixture, poisonBowSupercriticalSupportFixture, ...poisonBowInexorableSupportFixtures, poisonBowPinpointSupportFixture, poisonBowAmbushSupportFixture]
        .map((support): { id: string; name: string } => ({ id: support.id,name: support.name }))
        .concat(poisonBowBrutalitySupports)
        .sort((a, b) => poisonBowReviewedSupportIds.indexOf(a.id) - poisonBowReviewedSupportIds.indexOf(b.id)).map((s) => `Use ${s.name}`)
        .concat(poisonBowLifeLeechSupportFixtures.map(s => `Use ${s.name}`))
        .concat(`Use ${poisonBowManaLeechSupportFixture.name}`)
        .concat(poisonBowStunSupportFixtures.map(s => `Use ${s.name}`))
        .concat(poisonBowPinSupportFixtures.map(s => `Use ${s.name}`))
        .concat(poisonBowDrainSupportFixtures.map(s => `Use ${s.name}`))
        .concat(poisonBowArmourBreakSupportFixtures.map(s => `Use ${s.name}`))
        .concat(poisonBowArmourDemolisherSupportFixtures.map(s => `Use ${s.name}`))
        .concat([`Use ${poisonBowArmourExplosionSupportFixture.name}`])
        .concat(poisonBowBleedAggravationSupports.map(s => `Use ${s.name}`))
        .concat(poisonBowDeepCutsSupports.map(s => `Use ${s.name}`))
        .concat(focusSkillId === "gas-arrow" ? ["Use Overabundance I", "Use Overabundance II"] : []));
    for (const f of poisonBowSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      const selected = onChange.mock.calls.at(-1)![0];
      expect(selected).toEqual({ ...current, supportGemIds: [f.id] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      const note = document.getElementById(`support-${f.id}-summary`)!.textContent;
      expect(note).toContain("priorities stay unchanged");
      if (f.kind === "duration") expect(note).toContain(focusSkillId === "gas-arrow" ? "not its outgoing two-second Poison duration" : "linked outgoing Poison duration");
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
      expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toContain("Fire Damage");
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
      expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, supportGemIds: [] });
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    }
    const linked = { ...current, supportGemIds: ["magnified-area-i", "prolonged-duration-i", "efficiency-i"] };
    rerender(<SkillPreferencePresetControls settings={linked} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Prolonged Duration II" }));
    const upgraded = onChange.mock.calls.at(-1)![0];
    expect(upgraded).toEqual({ ...current, supportGemIds: ["magnified-area-i", "efficiency-i", "prolonged-duration-ii"] });
    rerender(<SkillPreferencePresetControls settings={upgraded} onChange={onChange} disabled />);
    for (const input of screen.getAllByRole("checkbox")) expect(input.matches(":disabled")).toBe(true);
  });

  it.each(["poisonburst-arrow", "gas-arrow"])("offers %s's Poison focus without inferring hit, Fire, critical or unreviewed support benefits", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), preferences: [{ id: "poisonMagnitude", weight: 1 }, { id: "life", weight: 3 },
      { id: "fireDamage", weight: 2 }, { id: "criticalChance", weight: 1 }, { id: "chaosDamage", weight: 2 }] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    selectPickerOption(screen.getByRole("combobox", { name: "Skill" }), focusSkillId);
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...initial, focusSkillId, supportGemIds: undefined, socketedGrenadeId: undefined });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    const p = getSkillPreferencePreset(focusSkillId)!;
    expect(screen.getByText(p.description)).not.toBeNull();
    expect(screen.getByRole("checkbox", { name: `Use Poison Magnitude for ${p.name}` })).toHaveProperty("checked", true);
    expect(screen.getByRole("checkbox", { name: `Use Skill Effect Duration for ${p.name}` })).toHaveProperty("checked", false);
    for (const name of ["Fire Damage", "Chaos Damage", "Damage over Time", "Critical Hit Chance", "Chance to Poison"])
      expect(screen.queryByRole("checkbox", { name: `Use ${name} for ${p.name}` })).toBeNull();
    const warning = screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent;
    expect(warning).toContain("Fire Damage");
    expect(warning).toContain("Chaos Damage");
    expect(warning).toContain("fake");
    expect(historicalSupportInputs(screen.getByRole("list", { name: `${p.name} reviewed supports` }))).toHaveLength(poisonBowReviewedSupportIdsFor(focusSkillId).length);
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    const added = onChange.mock.calls.at(-1)![0];
    expect(added.preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    expect(added.extraPointBudget).toBe(7);
    expect(added.preferences).toContainEqual({ id: "poisonDuration", weight: 2 });
    expect(added.preferences).toContainEqual({ id: "skillDuration", weight: 2 });
    expect(added.preferences).toContainEqual({ id: "attackDamage", weight: 2 });
    expect(added.preferences.filter((p: { id: string }) => p.id === "poisonMagnitude")).toEqual([{ id: "poisonMagnitude", weight: 1 }]);
    rerender(<SkillPreferencePresetControls settings={added} onChange={onChange} disabled />);
    for (const role of ["combobox", "checkbox", "button"]) for (const control of screen.getAllByRole(role)) expect(control.matches(":disabled")).toBe(!control.classList.contains("info-trigger"));
  });

  it("requires an explicit Mortar Grenade and preserves manual priorities when selecting or changing it", () => {
    const onChange = vi.fn();
    const current: PassiveOptimizationSettings = { ...settings(), focusSkillId: "mortar-cannon" };
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    const selector = screen.getByRole("combobox", { name: "Socketed Grenade" }) as HTMLSelectElement;
    expect(selector.value).toBe("");
    expect([...selector.options].map((o) => o.text)).toEqual(["Select a Grenade", "Explosive Grenade", "Flash Grenade", "Gas Grenade", "Voltaic Grenade", "Oil Grenade", "Cluster Grenade"]);
    expect((screen.getByRole("button", { name: "Add suggestions" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(selector, { target: { value: "explosive-grenade" } });
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...current, socketedGrenadeId: "explosive-grenade" });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    const added = onChange.mock.calls.at(-1)![0];
    expect(added.preferences[0]).toEqual({ id: "energyShield", weight: 3 });
    expect(added.preferences).toContainEqual({ id: "totemDamage", weight: 3 });
    expect(added.preferences).toContainEqual({ id: "fireDamage", weight: 3 });
    rerender(<SkillPreferencePresetControls settings={added} onChange={onChange} disabled={false} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Socketed Grenade" }), { target: { value: "gas-grenade" } });
    const gas = onChange.mock.calls.at(-1)![0];
    expect(gas.preferences).toEqual(added.preferences);
    expect(gas.extraPointBudget).toBe(7);
    rerender(<SkillPreferencePresetControls settings={gas} onChange={onChange} disabled />);
    expect((screen.getByRole("combobox", { name: "Socketed Grenade" }) as HTMLSelectElement).disabled).toBe(true);
    expect(screen.queryByRole("checkbox", { name: "Use Fire Damage for Mortar Cannon" })).toBeNull();
    expect(screen.getByRole("checkbox", { name: "Use Physical Damage for Mortar Cannon" })).not.toBeNull();
    expect(within(screen.getByRole("group", { name: "Reviewed supports" })).queryAllByRole("checkbox", { name: /^Use /, checked: true })).toHaveLength(0);
    rerender(<SkillPreferencePresetControls settings={gas} onChange={onChange} disabled={false} />);
    selectPickerOption(screen.getByRole("combobox", { name: "Skill" }), "spark");
    expect(onChange.mock.calls.at(-1)![0]).toMatchObject({ focusSkillId: "spark", socketedGrenadeId: undefined, preferences: gas.preferences });
  });

  it.each(["armour-piercing-rounds", "gas-grenade", "lunar-assault", "pounce", "walking-calamity", "artillery-ballista", "siege-ballista",
    "ember-fusillade", "living-bomb", "incinerate", "flame-wall", "orb-of-storms", "lightning-conduit", "lightning-warp", "thunderstorm"])("offers %s without applying weights or inferring supports", (focusSkillId) => {
    const current = settings();
    const onChange = vi.fn();
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    selectPickerOption(screen.getByRole("combobox", { name: "Skill" }), focusSkillId);
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected.preferences).toEqual(current.preferences);
    expect(selected.extraPointBudget).toBe(7);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(screen.getByText(getSkillPreferencePreset(focusSkillId)!.description)).not.toBeNull();
    expect(within(screen.getByRole("group", { name: "Reviewed supports" })).queryAllByRole("checkbox", { name: /^Use /, checked: true })).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    expect(onChange.mock.calls.at(-1)![0].preferences[0]).toEqual({ id: "energyShield", weight: 3 });
  });

  it.each(["vine-arrow", "toxic-growth"])("offers %s with component-specific Poison warnings and explicit suggestions", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), preferences: [{ id: "life", weight: 3 }, { id: "poisonMagnitude", weight: 2 }, { id: "poisonDuration", weight: 1 }] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    selectPickerOption(screen.getByRole("combobox", { name: "Skill" }), focusSkillId);
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...initial, focusSkillId, supportGemIds: undefined, socketedGrenadeId: undefined });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(screen.getByText(getSkillPreferencePreset(focusSkillId)!.description)).not.toBeNull();
    const warning = screen.getByRole("note", { name: "Preferences outside this skill focus" });
    expect(warning.textContent).toContain("Poison Magnitude");
    expect(warning.textContent).toContain("Poison Duration");
    expect(screen.queryByRole("checkbox", { name: "Use Attack Damage for Vine Arrow" })).toBeNull();
    expect(screen.queryByRole("checkbox", { name: "Use Chaos Damage for Toxic Growth" })).toBeNull();
    expect(screen.queryByRole("checkbox", { name: "Use Poison Magnitude for Vine Arrow" })).toBeNull();
    expect(screen.queryByRole("checkbox", { name: "Use Poison Magnitude for Toxic Growth" })).toBeNull();
    expect((screen.getByRole("checkbox", { name: "Use Magnified Area I" }) as HTMLInputElement).checked).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    const added = onChange.mock.calls.at(-1)![0];
    expect(added.preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    expect(added.preferences).toContainEqual({ id: focusSkillId === "vine-arrow" ? "damageOverTime" : "attackDamage", weight: 3 });
    expect(added.extraPointBudget).toBe(7);
    rerender(<SkillPreferencePresetControls settings={added} onChange={onChange} disabled />);
    expect((screen.getByRole("combobox", { name: "Skill" }) as HTMLSelectElement).disabled).toBe(true);
  });

  it.each(plantBowSupportCompatibility)("offers only $skill's reviewed support pairs and preserves manual priorities on selection/removal", ({ skill, allowed }) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId: skill,
      preferences: [{ id: "life", weight: 3 }, { id: "poisonMagnitude", weight: 2 }, { id: "poisonDuration", weight: 1 }] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    for (const support of [...plantBowSupportFixtures, ...plantBowSpeedSupportFixtures]) {
      const label = `Use ${support.name}`;
      if (!(allowed as readonly string[]).includes(support.id)) {
        expect(screen.queryByRole("checkbox", { name: label })).toBeNull();
        continue;
      }
      fireEvent.click(screen.getByRole("checkbox", { name: label }));
      const selected = onChange.mock.calls.at(-1)![0];
      expect(selected).toEqual({ ...initial, supportGemIds: [support.id] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      const detail = document.getElementById(`support-${support.id}-summary`)!;
      expect(detail.textContent?.toLowerCase()).toContain("priorities stay unchanged");
      expect(document.getElementById(`support-${support.id}-summary`)?.querySelector("a")?.getAttribute("aria-label")).toBe(`${support.name} data reference`);
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
      expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toContain("Poison Magnitude");
      fireEvent.click(screen.getByRole("checkbox", { name: label }));
      expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...initial, supportGemIds: [] });
      rerender(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
      expect(document.getElementById(`support-${support.id}-summary`)).toBeNull();
    }
    const selected = { ...initial, supportGemIds: ["magnified-area-ii", "efficiency-i"] };
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Efficiency II" }));
    const replaced = onChange.mock.calls.at(-1)![0];
    expect(replaced).toEqual({ ...selected, supportGemIds: ["magnified-area-ii", "efficiency-ii"] });
    rerender(<SkillPreferencePresetControls settings={replaced} onChange={onChange} disabled />);
    for (const checkbox of screen.getAllByRole("checkbox")) expect(checkbox.matches(":disabled")).toBe(true);
    rerender(<SkillPreferencePresetControls settings={replaced} onChange={onChange} disabled={false} />);
    selectPickerOption(screen.getByRole("combobox", { name: "Skill" }), skill === "vine-arrow" ? "toxic-growth" : "vine-arrow");
    expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...replaced, focusSkillId: skill === "vine-arrow" ? "toxic-growth" : "vine-arrow", supportGemIds: undefined, socketedGrenadeId: undefined });
  });

  it.each(["vine-arrow", "toxic-growth"])("replaces %s's speed support tiers without a damage conversion or changes to other families", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId, supportGemIds: ["magnified-area-ii", "efficiency-ii"],
      preferences: [{ id: "attackSpeed", weight: 1 }, { id: "projectileSpeed", weight: 1 }, { id: "poisonMagnitude", weight: 2 }] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    for (const support of plantBowSpeedSupportFixtures) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${support.name}` }));
      current = onChange.mock.calls.at(-1)![0];
      expect(current.preferences).toEqual(initial.preferences);
      expect(current.supportGemIds).toEqual(expect.arrayContaining(["magnified-area-ii", "efficiency-ii", support.id]));
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    }
    expect(current).toEqual({ ...initial, supportGemIds: ["magnified-area-ii", "efficiency-ii", "rapid-attacks-ii", "projectile-acceleration-ii"] });
    for (const name of ["Rapid Attacks I", "Projectile Acceleration I"]) expect((screen.getByRole("checkbox", { name: `Use ${name}` }) as HTMLInputElement).checked).toBe(false);
    expect(document.getElementById("support-projectile-acceleration-ii-summary")?.textContent).toContain("not attack speed or a damage conversion");
    expect(screen.queryByRole("checkbox", { name: "Use Projectile Acceleration III" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled />);
    for (const support of plantBowSpeedSupportFixtures) expect(screen.getByRole("checkbox", { name: `Use ${support.name}` }).matches(":disabled")).toBe(true);
  });

  it.each(plantBowTradeoffSupports)("shows $skill / $id's trade-off and changes only its displayed priority on explicit apply", (f) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId: f.skill, supportGemIds: ["efficiency-ii", "magnified-area-ii"],
      preferences: [{ id: "skillDuration", weight: 1 }, { id: "areaOfEffect", weight: 1 }, { id: "life", weight: 3 }, { id: "poisonMagnitude", weight: 2 }] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
    let current = onChange.mock.calls.at(-1)![0] as PassiveOptimizationSettings;
    expect(current).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds!, f.id] });
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    expect(document.getElementById(`support-${f.id}-summary`)?.textContent).toContain(f.skill === "vine-arrow" ? "exact game lifetime is unverified" : "not 50% less radius");
    const changeLabel = f.skill === "vine-arrow" ? "Skill Effect Duration: Normal -> Highest" : "Area of Effect: Normal -> High";
    expect(screen.getByRole("list", { name: "Support priority changes" }).textContent).toContain(changeLabel);
    expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toContain("Poison Magnitude");
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    current = onChange.mock.calls.at(-1)![0];
    expect(current.preferences.slice(0, initial.preferences.length)).toEqual(initial.preferences);
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled />);
    expect(screen.getByRole("button", { name: "Apply support priorities" }).matches(":disabled")).toBe(true);
    expect(screen.getByRole("checkbox", { name: `Use ${f.name}` }).matches(":disabled")).toBe(true);
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Apply support priorities" }));
    const applied = onChange.mock.calls.at(-1)![0];
    expect(applied.preferences).toEqual(current.preferences.map((p) => p.id === f.preference ? { ...p, weight: f.weight } : p));
    expect(applied.extraPointBudget).toBe(7);
    rerender(<SkillPreferencePresetControls settings={applied} onChange={onChange} disabled={false} />);
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: `Use ${f.name}` }));
    const removed = onChange.mock.calls.at(-1)![0];
    expect(removed.preferences).toEqual(applied.preferences);
    expect(removed.supportGemIds).toEqual(initial.supportGemIds);
    rerender(<SkillPreferencePresetControls settings={removed} onChange={onChange} disabled={false} />);
    expect(document.getElementById(`support-${f.id}-summary`)).toBeNull();
    if (f.skill === "vine-arrow") expect(screen.queryByRole("checkbox", { name: "Use Concentrated Area" })).toBeNull();
    else expect(screen.queryByRole("checkbox", { name: "Use Swift Affliction I" })).toBeNull();
  });

  it("replaces Vine Arrow's Swift Affliction tier while preserving Prolonged Duration and the exact-lifetime warning", () => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId: "vine-arrow", supportGemIds: ["prolonged-duration-ii", "swift-affliction-i"] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Swift Affliction II" }));
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...initial, supportGemIds: ["prolonged-duration-ii", "swift-affliction-ii"] });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-swift-affliction-i-summary")).toBeNull();
    expect(document.getElementById("support-swift-affliction-ii-summary")?.textContent).toContain("10% less skill-effect");
    expect(document.getElementById("support-swift-affliction-ii-summary")?.textContent).toContain("exact game lifetime is unverified");
    expect((screen.getByRole("checkbox", { name: "Use Prolonged Duration II" }) as HTMLInputElement).checked).toBe(true);
  });

  it.each(["entangle", "briarpatch", "thrashing-vines", "toxic-domain"])("offers %s's reviewed Plant support refinements without automatic weight or priority changes", (focusSkillId) => {
    const onChange = vi.fn();
    const current = { ...settings(), focusSkillId, preferences: [{ id: "plantDamage" as const, weight: 1 }, { id: "fireDamage" as const, weight: 2 }, { id: "poisonMagnitude" as const, weight: 3 }] };
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    const choices = ["Magnified Area I", "Magnified Area II", "Prolonged Duration I", "Prolonged Duration II", "Brutality I", "Brutality II", "Brutality III"];
    const ids = ["magnified-area-i", "magnified-area-ii", "prolonged-duration-i", "prolonged-duration-ii", "brutality-i", "brutality-ii", "brutality-iii"];
    if (focusSkillId !== "briarpatch") {
      choices.push("Efficiency I", "Efficiency II");
      ids.push("efficiency-i", "efficiency-ii");
    }
    if (focusSkillId === "entangle") { choices.push("Mobility"); ids.push("mobility"); }
    for (let i = 0; i < choices.length; i++) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${choices[i]}` }));
      const selected = onChange.mock.calls.at(-1)![0];
      expect(selected).toEqual({ ...current, supportGemIds: [ids[i]] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      expect(document.getElementById(`support-${ids[i]}-summary`)?.textContent).not.toContain("Warcry");
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
      if (ids[i].startsWith("brutality")) {
        const warning = screen.getByRole("note", { name: "Preferences outside this skill focus" });
        expect(warning.textContent).toContain("Poison Magnitude");
        expect(warning.textContent).toContain("still affects routing");
        if (focusSkillId === "toxic-domain") expect(document.getElementById(`support-${ids[i]}-summary`)?.textContent).toContain("prevents its Poison damage");
      }
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${choices[i]}` }));
      expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, supportGemIds: [] });
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    }
    if (["briarpatch", "toxic-domain"].includes(focusSkillId)) expect(screen.queryByRole("checkbox", { name: "Use Controlled Destruction" })).toBeNull();
    if (focusSkillId !== "entangle") expect(screen.queryByRole("checkbox", { name: "Use Mobility" })).toBeNull();
    if (focusSkillId === "briarpatch") expect(screen.queryByRole("checkbox", { name: "Use Efficiency I" })).toBeNull();
    else {
      rerender(<SkillPreferencePresetControls settings={{ ...current, supportGemIds: ["efficiency-i", "magnified-area-ii"] }} onChange={onChange} disabled={false} />);
      fireEvent.click(screen.getByRole("checkbox", { name: "Use Efficiency II" }));
      const replaced = onChange.mock.calls.at(-1)![0];
      expect(replaced).toEqual({ ...current, supportGemIds: ["magnified-area-ii", "efficiency-ii"] });
      rerender(<SkillPreferencePresetControls settings={replaced} onChange={onChange} disabled />);
      expect(screen.getByRole("checkbox", { name: "Use Efficiency II" }).matches(":disabled")).toBe(true);
      expect(document.getElementById("support-efficiency-ii-summary")?.textContent).toContain("40% less supported-skill cost");
    }
  });

  it.each(["entangle", "thrashing-vines"])("offers %s's casting supports with opt-in trade-off priorities", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId, supportGemIds: ["efficiency-ii"],
      preferences: [{ id: "castSpeed", weight: 1 }, { id: "life", weight: 3 }] };
    let current = initial;
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    for (const [id, name] of [["rapid-casting-i", "Rapid Casting I"], ["rapid-casting-ii", "Rapid Casting II"], ["rapid-casting-iii", "Rapid Casting III"]]) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${name}` }));
      current = onChange.mock.calls.at(-1)![0];
      expect(current).toEqual({ ...initial, supportGemIds: ["efficiency-ii", id] });
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
      expect(document.getElementById(`support-${id}-summary`)?.textContent).toContain(focusSkillId === "entangle" ? "100 ms vine-application interval" : "50% of cast time");
    }
    expect(document.getElementById("support-rapid-casting-iii-summary")?.textContent).toContain("Rotation and uptime are not assumed");
    expect((screen.getByRole("checkbox", { name: "Use Rapid Casting I" }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole("checkbox", { name: "Use Rapid Casting II" }) as HTMLInputElement).checked).toBe(false);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Considered Casting" }));
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...initial, supportGemIds: ["efficiency-ii", "rapid-casting-iii", "considered-casting"] });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-considered-casting-summary")?.textContent).toContain("15% less cast speed and a 115% Mana-cost multiplier");
    fireEvent.click(screen.getByRole("button", { name: "Apply support priorities" }));
    const applied = onChange.mock.calls.at(-1)![0];
    expect(applied).toEqual({ ...selected, preferences: [{ id: "castSpeed", weight: 2 }, { id: "life", weight: 3 }] });
    rerender(<SkillPreferencePresetControls settings={applied} onChange={onChange} disabled={false} />);
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Considered Casting" }));
    const removed = onChange.mock.calls.at(-1)![0];
    expect(removed.preferences).toEqual(applied.preferences);
    rerender(<SkillPreferencePresetControls settings={removed} onChange={onChange} disabled />);
    expect(screen.getByRole("checkbox", { name: "Use Rapid Casting III" }).matches(":disabled")).toBe(true);
    expect(document.getElementById("support-considered-casting-summary")).toBeNull();
  });

  it.each(["entangle", "thrashing-vines"])("warns about %s's prohibited critical hits and offers Echo only when reviewed", (focusSkillId) => {
    const onChange = vi.fn();
    const initial: PassiveOptimizationSettings = { ...settings(), focusSkillId, supportGemIds: ["rapid-casting-ii"],
      preferences: [{ id: "criticalChance", weight: 3 }, { id: "criticalDamageBonus", weight: 2 }, { id: "castSpeed", weight: 1 }, { id: "life", weight: 3 }] };
    const { rerender } = render(<SkillPreferencePresetControls settings={initial} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Controlled Destruction" }));
    let current: PassiveOptimizationSettings = onChange.mock.calls.at(-1)![0];
    expect(current).toEqual({ ...initial, supportGemIds: ["rapid-casting-ii", "controlled-destruction"] });
    rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    expect(document.getElementById("support-controlled-destruction-summary")?.textContent).toContain("cannot critically hit");
    const warning = screen.getByRole("note", { name: "Preferences outside this skill focus" });
    expect(warning.textContent).toContain("Critical Hit Chance");
    expect(warning.textContent).toContain("Critical Damage Bonus");
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    if (focusSkillId === "entangle") expect(screen.queryByRole("checkbox", { name: "Use Spell Echo" })).toBeNull();
    else {
      fireEvent.click(screen.getByRole("checkbox", { name: "Use Spell Echo" }));
      const selected = onChange.mock.calls.at(-1)![0];
      expect(selected).toEqual({ ...initial, supportGemIds: ["rapid-casting-ii", "controlled-destruction", "spell-echo"] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      expect(document.getElementById("support-spell-echo-summary")?.textContent).toContain("40% increased area is Echo-only");
      fireEvent.click(screen.getByRole("button", { name: "Apply support priorities" }));
      current = onChange.mock.calls.at(-1)![0];
      expect(current.preferences).toEqual(initial.preferences.map((p) => p.id === "castSpeed" ? { ...p, weight: 2 } : p));
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    }
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Controlled Destruction" }));
    const removed = onChange.mock.calls.at(-1)![0];
    expect(removed.preferences).toEqual(current.preferences);
    expect(removed.supportGemIds).toContain("rapid-casting-ii");
    rerender(<SkillPreferencePresetControls settings={removed} onChange={onChange} disabled />);
    expect(screen.queryByRole("note", { name: "Preferences outside this skill focus" })).toBeNull();
    expect(document.getElementById("support-controlled-destruction-summary")).toBeNull();
    expect(screen.getByRole("checkbox", { name: "Use Controlled Destruction" }).matches(":disabled")).toBe(true);
    if (focusSkillId === "thrashing-vines") expect((screen.getByRole("checkbox", { name: "Use Spell Echo" }) as HTMLInputElement).checked).toBe(true);
  });

  it.each(["galvanic-shards", "explosive-shot", "explosive-grenade", "rake", "maul", "shred"])("selects %s using the Skill picker without silently applying suggestions", (focusSkillId) => {
    const current = settings();
    const onChange = vi.fn();
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    selectPickerOption(screen.getByRole("combobox", { name: "Skill" }), focusSkillId);
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...current, focusSkillId });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(screen.getByText(getSkillPreferencePreset(focusSkillId)!.description)).not.toBeNull();
    expect(screen.queryByRole("checkbox", { name: "Use Controlled Destruction" })).toBeNull();
    expect(within(screen.getByRole("group", { name: "Reviewed supports" })).queryAllByRole("checkbox", { name: /^Use /, checked: true })).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    const added = onChange.mock.calls.at(-1)![0];
    expect(added.preferences[0]).toEqual({ id: "energyShield", weight: 3 });
    expect(added.preferences).toContainEqual({ id: "attackDamage", weight: 3 });
    expect(added.extraPointBudget).toBe(7);
  });

  it.each(["infernal-cry", "seismic-cry", "ancestral-cry", "fortifying-cry", "ferocious-roar"])("offers only %s's reviewed base-use supports without applying passive weights", (focusSkillId) => {
    const onChange = vi.fn();
    const current: PassiveOptimizationSettings = { ...settings(), focusSkillId, preferences: [{ id: "warcrySpeed", weight: 1 }, { id: "armour", weight: 3 }] };
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    const cases = [
      ["magnified-area-i", "Magnified Area I", true, "Warcry coverage is not empowered-attack area or enemy Power"],
      ["magnified-area-ii", "Magnified Area II", true, "45% increased area"],
      ["prolonged-duration-i", "Prolonged Duration I", !["seismic-cry", "ferocious-roar"].includes(focusSkillId), "Warcry timers do not guarantee empowerment, Guard strength or Glory"],
      ["prolonged-duration-ii", "Prolonged Duration II", !["seismic-cry", "ferocious-roar"].includes(focusSkillId), "35% more duration"],
      ["efficiency-i", "Efficiency I", true, "application cost, not triggered damage or buff strength"],
      ["efficiency-ii", "Efficiency II", true, "40% less supported-skill cost"],
      ["mobility", "Mobility", focusSkillId !== "ferocious-roar", "base human-form use, not Ferocious Roar or socketed replacement"],
      ["raging-cry", "Raging Cry", true, "4 Rage per 5 counted enemy Power"],
      ["exposing-cry", "Exposing Cry", focusSkillId === "seismic-cry", "Exposure on Hit for 5 seconds"],
      ["enraged-warcry-i", "Enraged Warcry I", focusSkillId !== "ancestral-cry", "Spends 20 Rage instead of an Endurance Charge"],
      ["enraged-warcry-ii", "Enraged Warcry II", focusSkillId !== "ancestral-cry", "Spends 15 Rage instead of an Endurance Charge"],
      ["echoing-cry", "Echoing Cry", focusSkillId !== "ancestral-cry", "Two echoes 1.3 seconds apart"],
      ["corrupting-cry-i", "Corrupting Cry I", true, "Tier I has 30% less Warcry area"],
      ["corrupting-cry-ii", "Corrupting Cry II", true, "Tier II has no Tier-I Warcry-area penalty"],
    ] as const;
    for (const [id, name, allowed, detail] of cases) {
      if (!allowed) { expect(screen.queryByRole("checkbox", { name: `Use ${name}` })).toBeNull(); continue; }
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${name}` }));
      const selected = onChange.mock.calls.at(-1)![0];
      expect(selected).toEqual({ ...current, supportGemIds: [id] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      expect(document.getElementById(`support-${id}-summary`)?.textContent).toContain(detail);
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${name}` }));
      expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, supportGemIds: [] });
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    }
    expect(screen.queryByRole("checkbox", { name: "Use Spell Echo" })).toBeNull();
    rerender(<SkillPreferencePresetControls settings={{ ...current, supportGemIds: ["magnified-area-i", "efficiency-i"] }} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Magnified Area II" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, supportGemIds: ["efficiency-i", "magnified-area-ii"] });
    if (focusSkillId !== "ancestral-cry") {
      rerender(<SkillPreferencePresetControls settings={{ ...current, supportGemIds: ["raging-cry", "enraged-warcry-i"] }} onChange={onChange} disabled={false} />);
      fireEvent.click(screen.getByRole("checkbox", { name: "Use Enraged Warcry II" }));
      expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, supportGemIds: ["raging-cry", "enraged-warcry-ii"] });
    }
    rerender(<SkillPreferencePresetControls settings={{ ...current, supportGemIds: ["raging-cry", "corrupting-cry-i"] }} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Corrupting Cry II" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, supportGemIds: ["raging-cry", "corrupting-cry-ii"] });
  });
  it("updates Seismic Cry's duration caution for Exposing Cry without adding weights or enabling unreviewed combinations", () => {
    const current: PassiveOptimizationSettings = { ...settings(), focusSkillId: "seismic-cry", supportGemIds: ["exposing-cry"], preferences: [{ id: "skillDuration", weight: 2 }] };
    render(<SkillPreferencePresetControls settings={current} onChange={vi.fn()} disabled={false} />);
    expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toContain("Exposing Cry adds a Duration type for its on-hit Exposure");
    expect(screen.queryByRole("checkbox", { name: "Use Prolonged Duration I" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
  });
  it.each(["infernal-cry", "seismic-cry", "ancestral-cry", "fortifying-cry", "ferocious-roar"])("selects %s's utility focus explicitly and preserves manual defence priorities", (id) => {
    const onChange = vi.fn();
    const current: PassiveOptimizationSettings = { ...settings(), preferences: [{ id: "warcrySpeed", weight: 1 }, { id: "armour", weight: 3 }, { id: "spellDamage", weight: 1 }] };
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    selectPickerOption(screen.getByLabelText("Skill"), id);
    const selected = onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({ ...current, focusSkillId: id });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    const p = getSkillPreferencePreset(id)!;
    expect(screen.getAllByRole("checkbox", { name: /^Use / }).filter(input=>!commonSupportLabels.has(input.getAttribute("aria-label") ?? ""))).toHaveLength(id === "ferocious-roar" ? 13 : id === "seismic-cry" ? 15 : id === "ancestral-cry" ? 13 : 16);
    expect(screen.getByRole("checkbox", { name: `Use Warcry Speed for ${p.name}` })).toHaveProperty("checked", true);
    expect(screen.getByRole("checkbox", { name: `Use Warcry Area of Effect for ${p.name}` })).toHaveProperty("checked", false);
    expect(screen.queryByRole("checkbox", { name: `Use Warcry Cooldown Recovery Rate for ${p.name}` }) === null).toBe(id === "ancestral-cry");
    expect(screen.getByRole("checkbox", { name: "Use Efficiency I" })).toHaveProperty("checked", false);
    expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toContain("player's Warcry");
    expect(document.getElementById("focus-skill-tooltip")?.querySelector("a")?.getAttribute("href")).toBe(p.sourceUrl);
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    const added = onChange.mock.calls.at(-1)![0];
    expect(added.preferences).toEqual([...current.preferences, ...p.suggestions.slice(1).map(({ id, weight }) => ({ id, weight }))]);
    expect(added.extraPointBudget).toBe(current.extraPointBudget);
    rerender(<SkillPreferencePresetControls settings={added} onChange={onChange} disabled={false} />);
    expect(screen.getByRole("button", { name: "Add suggestions" })).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("checkbox", { name: `Use Warcry Area of Effect for ${p.name}` }));
    expect(onChange.mock.calls.at(-1)![0].preferences).toEqual(added.preferences.filter((p: { id: string }) => p.id !== "warcryAreaOfEffect"));
    expect(screen.getByText(p.description)).not.toBeNull();
    if (id === "ancestral-cry") expect(screen.getByText(p.description).textContent).toContain("100 Glory");
    if (id === "ferocious-roar") expect(screen.getByText(p.description).textContent).toContain("requiring a Talisman");
    if (id === "fortifying-cry") expect(screen.getByText(p.description).textContent).toContain("Armoured Shield");
  });
  it.each(["snipers-mark", "bloodhounds-mark", "freezing-mark", "voltaic-mark"])("shows %s's five reviewed utility supports without changing passive priorities", (focusSkillId) => {
    const onChange = vi.fn();
    const current: PassiveOptimizationSettings = { ...settings(), focusSkillId, preferences: [{ id: "markEffect", weight: 1 }, { id: "energyShield", weight: 3 }] };
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    const supports = [["prolonged-duration-i", "Prolonged Duration I", "lengthen the secondary buff, not its strength"],
      ["prolonged-duration-ii", "Prolonged Duration II", "consumption, re-marking and uptime are not simulated"],
      ["efficiency-i", "Efficiency I", "application cost, not triggered damage or buff strength"],
      ["efficiency-ii", "Efficiency II", "40% less supported-skill cost"],
      ["mobility", "Mobility", "player application movement, not the consuming hit or Blood Explosion"]];
    for (const [id, name, detail] of supports) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${name}` }));
      const selected = onChange.mock.calls.at(-1)![0];
      expect(selected).toEqual({ ...current, supportGemIds: [id] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      expect(document.getElementById(`support-${id}-summary`)?.textContent).toContain(detail);
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
      expect(screen.queryByRole("checkbox", { name: "Use Spell Echo" })).toBeNull();
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${name}` }));
      expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, supportGemIds: [] });
      rerender(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    }
    rerender(<SkillPreferencePresetControls settings={{ ...current, supportGemIds: ["prolonged-duration-i", "efficiency-i", "mobility"] }} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Prolonged Duration II" }));
    expect(onChange.mock.calls.at(-1)![0]).toEqual({ ...current, supportGemIds: ["efficiency-i", "mobility", "prolonged-duration-ii"] });
  });
  it.each(["snipers-mark", "bloodhounds-mark", "freezing-mark", "voltaic-mark"])("selects %s's utility focus explicitly without turning tags or buffs into damage suggestions", (id) => {
    const onChange = vi.fn();
    const current: PassiveOptimizationSettings = { ...settings(), preferences: [{ id: "spellDamage", weight: 1 }, { id: "energyShield", weight: 3 }, { id: "markEffect", weight: 1 }] };
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    selectPickerOption(screen.getByLabelText("Skill"), id);
    const selected = onChange.mock.calls[0][0];
    expect(selected).toEqual({ ...current, focusSkillId: id });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    const name = getSkillPreferencePreset(id)!.name;
    expect(screen.getAllByRole("checkbox", { name: /^Use / }).filter(input=>!commonSupportLabels.has(input.getAttribute("aria-label") ?? ""))).toHaveLength(8);
    expect(screen.getByRole("checkbox", { name: `Use Mark Effect for ${name}` })).toHaveProperty("checked", true);
    expect(screen.getByRole("checkbox", { name: `Use Mark Duration for ${name}` })).toHaveProperty("checked", false);
    expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toContain("parent Mark applies a non-damaging debuff");
    expect(screen.queryByRole("checkbox", { name: `Use Attack Damage for ${name}` })).toBeNull();
    expect(screen.queryByRole("checkbox", { name: `Use Minion Damage for ${name}` })).toBeNull();
    expect(screen.getByRole("checkbox", { name: "Use Efficiency I" })).toHaveProperty("checked", false);
    expect(document.getElementById("focus-skill-tooltip")?.querySelector("a")?.getAttribute("href")).toBe(getSkillPreferencePreset(id)!.sourceUrl);
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    const added = onChange.mock.calls[1][0];
    expect(added.preferences).toEqual([...current.preferences, { id: "markUseSpeed", weight: 1 }, { id: "markDuration", weight: 1 }]);
    expect(added.extraPointBudget).toBe(current.extraPointBudget);
    rerender(<SkillPreferencePresetControls settings={added} onChange={onChange} disabled={false} />);
    expect(screen.getByRole("button", { name: "Add suggestions" })).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("checkbox", { name: `Use Mark Duration for ${name}` }));
    expect(onChange.mock.calls[2][0].preferences).toEqual(added.preferences.filter((p: { id: string }) => p.id !== "markDuration"));
    if (id === "bloodhounds-mark") expect(screen.getByRole("list", { name: `${name} suggested effects` }).textContent).toContain("timer does not expire");
    if (id === "freezing-mark" || id === "voltaic-mark") expect(screen.getByRole("list", { name: `${name} suggested effects` }).textContent).toContain("separate post-consumption buff timer");
  });
  it.each(["skeletal-sniper", "skeletal-frost-mage", "skeletal-storm-mage", "skeletal-brute", "skeletal-cleric", "skeletal-reaver", "bone-offering", "pain-offering"])
    ("selects %s's reviewed ownership focus without implicitly adding or replacing weights", (id) => {
      const onChange = vi.fn();
      const current: PassiveOptimizationSettings = { ...settings(), preferences: [{ id: "spellDamage", weight: 1 }, { id: "energyShield", weight: 3 }] };
      const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      selectPickerOption(screen.getByLabelText("Skill"), id);
      const selected = onChange.mock.calls[0][0];
      expect(selected).toEqual({ ...current, focusSkillId: id });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      expect(screen.getByRole("list", { name: `${getSkillPreferencePreset(id)!.name} suggested effects` })).not.toBeNull();
      expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toContain("player damage preference");
      fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
      expect(onChange.mock.calls[1][0].preferences.slice(0, 2)).toEqual(current.preferences);
      expect(onChange.mock.calls[1][0].extraPointBudget).toBe(current.extraPointBudget);
      if (id === "skeletal-cleric") {
        expect(screen.queryByRole("checkbox", { name: "Use Feeding Frenzy I" })).toBeNull();
        expect(screen.getByRole("checkbox", { name: "Use Rapid Casting I" })).not.toBeNull();
        expect(screen.queryByRole("checkbox", { name: "Use Minion Damage for Skeletal Cleric" })).toBeNull();
      }
    });
  it.each([["bonestorm", "Considered Casting", "considered-casting"], ["despair", "Spell Echo", "spell-echo"]])
    ("offers %s's %s and applies only its displayed priority change", (focusSkillId, name, supportId) => {
      const onChange = vi.fn();
      const current: PassiveOptimizationSettings = { ...settings(), focusSkillId, preferences: [{ id: "castSpeed", weight: 1 }, { id: "curseActivation", weight: 3 }, { id: "energyShield", weight: 3 }] };
      const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${name}` }));
      const selected = onChange.mock.calls[0][0];
      expect(selected).toEqual({ ...current, supportGemIds: [supportId] });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      expect(screen.getByRole("list", { name: "Support priority changes" }).textContent).toContain("Cast Speed: Normal -> High");
      fireEvent.click(screen.getByRole("button", { name: "Apply support priorities" }));
      expect(onChange.mock.calls[1][0].preferences).toEqual([{ id: "castSpeed", weight: 2 }, ...current.preferences.slice(1)]);
    });
  it.each(["I", "II", "III"])("warns about Detonate Dead's manual Fire Damage under Brutality %s without silently deleting it", (tier) => {
    const onChange = vi.fn();
    const current: PassiveOptimizationSettings = { ...settings(), focusSkillId: "detonate-dead", preferences: [{ id: "fireDamage", weight: 1 }, { id: "energyShield", weight: 3 }] };
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: `Use Brutality ${tier}` }));
    const selected = onChange.mock.calls[0][0];
    expect(selected.preferences).toEqual(current.preferences);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(screen.queryByRole("checkbox", { name: "Use Fire Damage for Detonate Dead" })).toBeNull();
    expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toContain("still affects routing");
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
  });
  it.each([
    ["contagion", "Magnified Area II", "magnified-area-ii"],
    ["despair", "Prolonged Duration II", "prolonged-duration-ii"],
    ["dark-effigy", "Mobility", "mobility"],
    ["dark-effigy", "Rapid Casting III", "rapid-casting-iii"],
    ["bonestorm", "Projectile Acceleration II", "projectile-acceleration-ii"],
  ])("offers %s's reviewed %s without a fabricated priority command", (focusSkillId, name, id) => {
    const onChange = vi.fn();
    const current: PassiveOptimizationSettings = { ...settings(), focusSkillId };
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: `Use ${name}` }));
    const selected = onChange.mock.calls[0][0];
    expect(selected).toEqual({ ...current, supportGemIds: [id] });
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(document.getElementById(`support-${id}-summary`)?.textContent).not.toBe("");
    expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    if (focusSkillId === "dark-effigy") expect(screen.queryByRole("checkbox", { name: "Use Prolonged Duration I" })).toBeNull();
  });
  it.each(["contagion", "bonestorm", "bone-cage", "despair", "vulnerability", "hexblast", "unearth", "detonate-dead", "dark-effigy"])
    ("selects the scoped %s focus and applies its suggestions without replacing existing weights", (id) => {
      const onChange = vi.fn();
      const current: PassiveOptimizationSettings = { ...settings(), preferences: [...settings().preferences, { id: "spellDamage", weight: 1 }] };
      const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      selectPickerOption(screen.getByLabelText("Skill"), id);
      const selected = onChange.mock.calls[0][0];
      expect(selected).toEqual({ ...current, focusSkillId: id });
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      expect(screen.getByRole("list", { name: `${getSkillPreferencePreset(id)!.name} suggested effects` })).not.toBeNull();
      expect(screen.getByRole("checkbox", { name: "Use Efficiency I" })).not.toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
      const added = onChange.mock.calls[1][0];
      expect(added.preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
      expect(added.extraPointBudget).toBe(current.extraPointBudget);
      expect(added.focusSkillId).toBe(id);
      expect(new Set(added.preferences.map((p: { id: string }) => p.id)).size).toBe(added.preferences.length);
    });
  it.each(["magnified-area-i", "magnified-area-ii", "prolonged-duration-i", "prolonged-duration-ii", "efficiency-i", "efficiency-ii", "mobility"])
    ("selects %s in the existing list without offering an invented priority change", (supportId) => {
      const names: Record<string, string> = { "magnified-area-i": "Magnified Area I", "magnified-area-ii": "Magnified Area II",
        "prolonged-duration-i": "Prolonged Duration I", "prolonged-duration-ii": "Prolonged Duration II", "efficiency-i": "Efficiency I",
        "efficiency-ii": "Efficiency II", mobility: "Mobility" };
      const current: PassiveOptimizationSettings = { ...settings(), focusSkillId: "firestorm" };
      const onChange = vi.fn();
      const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      fireEvent.click(screen.getByRole("checkbox", { name: `Use ${names[supportId]}` }));
      const selected = onChange.mock.calls[0][0];
      expect(selected.supportGemIds).toEqual([supportId]);
      expect(selected.preferences).toEqual(current.preferences);
      expect(selected.extraPointBudget).toBe(current.extraPointBudget);
      rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
      expect(document.getElementById(`support-${supportId}-summary`)?.textContent).toContain("priorities are unchanged");
      expect(screen.queryByRole("button", { name: "Apply support priorities" })).toBeNull();
    });
  it("replaces casting tiers and applies the displayed casting tradeoff only on explicit command", () => {
    const onChange = vi.fn();
    const current: PassiveOptimizationSettings = { ...settings(), focusSkillId: "frostbolt", preferences: [{ id: "castSpeed", weight: 1 }, { id: "energyShield", weight: 3 }] };
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Rapid Casting I" }));
    const first = onChange.mock.calls[0][0];
    expect(first.preferences).toEqual(current.preferences);
    rerender(<SkillPreferencePresetControls settings={first} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Rapid Casting III" }));
    const tier = onChange.mock.calls[1][0];
    expect(tier.supportGemIds).toEqual(["rapid-casting-iii"]);
    rerender(<SkillPreferencePresetControls settings={tier} onChange={onChange} disabled={false} />);
    expect(screen.getByText(/Conditional cast speed per different spell/)).not.toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Considered Casting" }));
    const considered = onChange.mock.calls[2][0];
    expect(considered.preferences).toEqual(current.preferences);
    rerender(<SkillPreferencePresetControls settings={considered} onChange={onChange} disabled={false} />);
    expect(screen.getByRole("list", { name: "Support priority changes" }).textContent).toContain("Cast Speed: Normal -> High");
    fireEvent.click(screen.getByRole("button", { name: "Apply support priorities" }));
    expect(onChange.mock.calls[3][0].preferences).toEqual([{ id: "castSpeed", weight: 2 }, { id: "energyShield", weight: 3 }]);
    expect(onChange.mock.calls[3][0].extraPointBudget).toBe(current.extraPointBudget);
  });
  it.each(["arc", "ball-lightning", "frostbolt", "ice-nova", "comet", "firestorm", "eye-of-winter", "frost-bomb", "flameblast", "frost-wall"])
    ("selects %s without changing choices and applies suggestions only on command", (id) => {
      const onChange = vi.fn();
      const current: PassiveOptimizationSettings = { ...settings(), preferences: [...settings().preferences, { id: "spellDamage", weight: 1 }] };
      const entry = getSkillPreferencePreset(id)!;
      const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
      selectPickerOption(screen.getByLabelText("Skill"), id);
      const chosen = onChange.mock.calls[0][0];
      expect(chosen).toEqual({ ...current, focusSkillId: id });
      rerender(<SkillPreferencePresetControls settings={chosen} onChange={onChange} disabled={false} />);
      expect(screen.getByRole("list", { name: `${entry.name} suggested effects` })).not.toBeNull();
      expect(screen.getByRole("checkbox", { name: "Use Controlled Destruction" })).not.toBeNull();
      expect(screen.queryByRole("checkbox", { name: "Use Concentrated Area" })).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
      const added = onChange.mock.calls[1][0];
      expect(added.preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
      expect(added.extraPointBudget).toBe(current.extraPointBudget);
      expect(added.preferences).toHaveLength(current.preferences.length + entry.suggestions.length - 1);
    });
  it("chooses a reviewed focus without silently changing existing preferences or budget", () => {
    const onChange = vi.fn();
    const current = settings();
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    selectPickerOption(screen.getByLabelText("Skill"), "enfeeble");
    const chosen = onChange.mock.calls[0][0];
    expect(chosen).toEqual({ ...current, focusSkillId: "enfeeble" });
    rerender(<SkillPreferencePresetControls settings={chosen} onChange={onChange} disabled={false} />);
    expect(screen.getByRole("list", { name: "Enfeeble suggested effects" })).not.toBeNull();
    expect(screen.getByRole("checkbox", { name: "Use Curse Magnitudes for Enfeeble" })).not.toBeNull();
    expect(screen.queryByRole("checkbox", { name: "Use Spell Damage for Enfeeble" })).toBeNull();
    expect(document.getElementById("focus-skill-tooltip")?.querySelector("a")?.getAttribute("href")).toMatch(/^https:\/\/github.com\//);
  });
  it("merges all suggestions without overwriting priorities and lets individual effects be removed", () => {
    const onChange = vi.fn();
    const current: PassiveOptimizationSettings = { ...settings(), focusSkillId: "enfeeble", preferences: [...settings().preferences, { id: "curseMagnitude", weight: 1 }] };
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Add suggestions" }));
    const merged = onChange.mock.calls[0][0] as PassiveOptimizationSettings;
    expect(merged.preferences).toContainEqual({ id: "energyShield", weight: 3 });
    expect(merged.preferences).toContainEqual({ id: "curseMagnitude", weight: 1 });
    expect(merged.extraPointBudget).toBe(7);
    expect(new Set(merged.preferences.map((preference) => preference.id)).size).toBe(merged.preferences.length);
    rerender(<SkillPreferencePresetControls settings={merged} onChange={onChange} disabled={false} />);
    expect((screen.getByRole("button", { name: "Add suggestions" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Curse Magnitudes for Enfeeble" }));
    expect(onChange.mock.calls[1][0].preferences.some((preference: { id: string }) => preference.id === "curseMagnitude")).toBe(false);
  });
  it("enables a suggested effect at its reviewed priority", () => {
    const onChange = vi.fn();
    render(<SkillPreferencePresetControls settings={{ ...settings(), focusSkillId: "enfeeble" }} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Curse Magnitudes for Enfeeble" }));
    expect(onChange.mock.calls[0][0].preferences).toContainEqual({ id: "curseMagnitude", weight: getSkillPreferencePreset("enfeeble")!.suggestions.find((row) => row.id === "curseMagnitude")!.weight });
  });
  it("warns about an irrelevant manual preference without deleting it", () => {
    const onChange = vi.fn();
    render(<SkillPreferencePresetControls settings={{ ...settings(), focusSkillId: "enfeeble", preferences: [{ id: "spellDamage", weight: 2 }] }} onChange={onChange} disabled={false} />);
    expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toContain("Spell Damage");
    expect(onChange).not.toHaveBeenCalled();
  });
  it("does not remove previous preferences when changing focus or returning to manual", () => {
    const onChange = vi.fn();
    const current: PassiveOptimizationSettings = { ...settings(), focusSkillId: "enfeeble", supportGemIds: ["ritualistic-curse"] };
    render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    selectPickerOption(screen.getByLabelText("Skill"), "spark");
    expect(onChange.mock.calls[0][0]).toEqual({ ...current, focusSkillId: "spark", supportGemIds: undefined });
    selectPickerOption(screen.getByLabelText("Skill"), "");
    expect(onChange.mock.calls[1][0]).toEqual({ ...current, focusSkillId: undefined, supportGemIds: undefined });
  });
  it("lists only reviewed supports and changes existing priorities only on explicit apply", () => {
    const onChange = vi.fn();
    const current: PassiveOptimizationSettings = { ...settings(), focusSkillId: "spark", preferences: [...settings().preferences, { id: "projectileSpeed", weight: 1 }] };
    const { rerender } = render(<SkillPreferencePresetControls settings={current} onChange={onChange} disabled={false} />);
    expect(screen.queryByRole("checkbox", { name: "Use Swift Affliction II" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Use Projectile Acceleration III" }));
    const selected = onChange.mock.calls[0][0];
    expect(selected.preferences).toEqual(current.preferences);
    rerender(<SkillPreferencePresetControls settings={selected} onChange={onChange} disabled={false} />);
    expect(screen.getByRole("list", { name: "Support priority changes" }).textContent).toContain("Projectile Speed: Normal -> Highest");
    fireEvent.click(screen.getByRole("button", { name: "Apply support priorities" }));
    expect(onChange.mock.calls[1][0].preferences).toEqual([{ id: "energyShield", weight: 3 }, { id: "projectileSpeed", weight: 3 }]);
  });
  it("shows support-specific critical-hit warnings while retaining the manual choice", () => {
    const onChange = vi.fn();
    render(<SkillPreferencePresetControls settings={{ ...settings(), focusSkillId: "spark", supportGemIds: ["controlled-destruction"], preferences: [{ id: "criticalChance", weight: 3 }] }} onChange={onChange} disabled={false} />);
    expect(screen.getByRole("note", { name: "Preferences outside this skill focus" }).textContent).toContain("Controlled Destruction prevents");
    expect(document.getElementById("support-controlled-destruction-summary")?.querySelector("a")?.getAttribute("aria-label")).toBe("Controlled Destruction data reference");
    expect(onChange).not.toHaveBeenCalled();
  });
  it("disables the focus, suggestions and bulk action during optimization", () => {
    render(<SkillPreferencePresetControls settings={{ ...settings(), focusSkillId: "enfeeble", supportGemIds: ["ritualistic-curse"] }} onChange={vi.fn()} disabled />);
    for (const role of ["combobox", "checkbox", "button"]) for (const control of screen.getAllByRole(role)) expect(control.matches(":disabled")).toBe(!control.classList.contains("info-trigger"));
  });
});
