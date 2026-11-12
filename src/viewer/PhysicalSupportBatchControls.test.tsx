import { fireEvent,render,screen } from "@testing-library/react";
import { describe,expect,it,vi } from "vitest";
import { physicalSupportFixtures as fixtures } from "../tree/physicalSupportBatch.fixtures";
import { getSkillPreferencePreset } from "../tree/skillPreferencePresets";
import type { PassiveOptimizationSettings } from "../tree/passivePreferences";
import { SkillSupportControls } from "./SkillSupportControls";

describe("50 Physical, weapon and positional support controls",()=>{
  it.each(fixtures)("selects $name, preserves manual settings and respects running state",f=>{
    const preset=getSkillPreferencePreset(f.reviewedSkillIds[0])!,onChange=vi.fn();
    const settings:PassiveOptimizationSettings={mode:"weighted",focusSkillId:preset.id,extraPointBudget:8,pointBudgetMode:"all-available",preferences:[{id:"energyShield",weight:3}]};
    const {rerender}=render(<SkillSupportControls preset={preset} settings={settings} onChange={onChange} disabled={false}/>);
    fireEvent.click(screen.getByRole("checkbox",{name:"Use "+f.name}));
    const selected=onChange.mock.calls.at(-1)![0];
    expect(selected).toEqual({...settings,supportGemIds:[f.supportId]});
    rerender(<SkillSupportControls preset={preset} settings={selected} onChange={onChange} disabled={false}/>);
    expect(document.getElementById(`support-${f.supportId}-summary`)?.querySelector("a")?.getAttribute("aria-label")).toBe(f.name+" data reference");
    if(screen.queryByRole("button",{name:"Apply support priorities"})){
      fireEvent.click(screen.getByRole("button",{name:"Apply support priorities"}));
      expect(onChange.mock.calls.at(-1)![0].preferences[0]).toEqual(settings.preferences[0]);
    }
    rerender(<SkillSupportControls preset={preset} settings={selected} onChange={onChange} disabled={true}/>);
    expect(screen.getByRole("checkbox",{name:"Use "+f.name}).matches(":disabled")).toBe(true);
  });

  it("replaces Acceleration with Deceleration rather than stacking them",()=>{
    const preset=getSkillPreferencePreset("poisonburst-arrow")!,onChange=vi.fn();
    const settings:PassiveOptimizationSettings={mode:"weighted",focusSkillId:preset.id,extraPointBudget:5,preferences:[],supportGemIds:["projectile-acceleration-i"]};
    const {rerender}=render(<SkillSupportControls preset={preset} settings={settings} onChange={onChange} disabled={false}/>);
    fireEvent.click(screen.getByRole("checkbox",{name:"Use Projectile Deceleration II"}));
    const selected=onChange.mock.calls.at(-1)![0];
    expect(selected.supportGemIds).toEqual(["projectile-deceleration-ii"]);
    rerender(<SkillSupportControls preset={preset} settings={selected} onChange={onChange} disabled={false}/>);
    expect((screen.getByRole("checkbox",{name:"Use Projectile Acceleration I"}) as HTMLInputElement).checked).toBe(false);
  });

  it("keeps Excise's cooldown when critical hits are forbidden",()=>{
    const preset=getSkillPreferencePreset("fireball")!,onChange=vi.fn();
    const settings:PassiveOptimizationSettings={mode:"weighted",focusSkillId:preset.id,extraPointBudget:5,preferences:[{id:"energyShield",weight:3}],supportGemIds:["excise","controlled-destruction"]};
    render(<SkillSupportControls preset={preset} settings={settings} onChange={onChange} disabled={false}/>);
    expect(document.getElementById("support-excise-summary")!.textContent).toContain("cooldown still applies");
    fireEvent.click(screen.getByRole("button",{name:"Apply support priorities"}));
    expect(onChange.mock.calls.at(-1)![0].preferences).toEqual([...settings.preferences,{id:"cooldownRecoveryRate",weight:2}]);
  });

  it("shows the Bleeding prohibition without treating external Bleeding as erased",()=>{
    const preset=getSkillPreferencePreset("poisonburst-arrow")!;
    render(<SkillSupportControls preset={preset} settings={{mode:"weighted",focusSkillId:preset.id,extraPointBudget:5,preferences:[],supportGemIds:["haemocrystals","bleed-iii"]}} onChange={vi.fn()} disabled={false}/>);
    expect(document.getElementById("support-bleed-iii-summary")!.textContent).toContain("external Bleeding remains separate");
    expect(screen.queryByRole("button",{name:"Apply support priorities"})).toBeNull();
  });
});
