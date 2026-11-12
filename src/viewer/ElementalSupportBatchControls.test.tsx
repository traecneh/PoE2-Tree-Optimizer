import { fireEvent,render,screen } from "@testing-library/react";
import { describe,expect,it,vi } from "vitest";
import { elementalSupportFixtures as fixtures } from "../tree/elementalSupportBatch.fixtures";
import { getSkillPreferencePreset } from "../tree/skillPreferencePresets";
import type { PassiveOptimizationSettings } from "../tree/passivePreferences";
import { SkillSupportControls } from "./SkillSupportControls";

describe("50 elemental and ailment support controls",()=>{
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

  it.each([
    ["spark","electrocute","Neural Overload","neural-overload","Electrocute"],
    ["eye-of-winter","elemental-discharge","Catalysing Elements","catalysing-elements","Elemental Discharge"],
    ["war-banner","refraction-i","Refraction III","refraction-iii","Refraction I"],
  ])("replaces native family choices for %s without stacking effects",(focus,previous,label,id,oldLabel)=>{
    const preset=getSkillPreferencePreset(focus)!,onChange=vi.fn();
    const settings:PassiveOptimizationSettings={mode:"weighted",focusSkillId:focus,extraPointBudget:5,preferences:[],supportGemIds:[previous]};
    const {rerender}=render(<SkillSupportControls preset={preset} settings={settings} onChange={onChange} disabled={false}/>);
    fireEvent.click(screen.getByRole("checkbox",{name:"Use "+label}));
    const selected=onChange.mock.calls.at(-1)![0];
    expect(selected.supportGemIds).toEqual([id]);
    rerender(<SkillSupportControls preset={preset} settings={selected} onChange={onChange} disabled={false}/>);
    expect((screen.getByRole("checkbox",{name:"Use "+oldLabel}) as HTMLInputElement).checked).toBe(false);
  });

  it("shows own-application warnings and does not offer prohibited priority changes",()=>{
    const preset=getSkillPreferencePreset("explosive-spear")!;
    render(<SkillSupportControls preset={preset} settings={{mode:"weighted",focusSkillId:preset.id,extraPointBudget:5,preferences:[],supportGemIds:["immolate","ignite-i"]}} onChange={vi.fn()} disabled={false}/>);
    expect(document.getElementById("support-ignite-i-summary")!.textContent).toContain("prevent this skill");
    expect(screen.queryByRole("button",{name:"Apply support priorities"})).toBeNull();
  });

  it("does not offer Exposure priorities without a reviewed application source",()=>{
    const preset=getSkillPreferencePreset("fireball")!,onChange=vi.fn();
    const settings:PassiveOptimizationSettings={mode:"weighted",focusSkillId:preset.id,extraPointBudget:5,preferences:[],supportGemIds:["potent-exposure"]};
    const {rerender}=render(<SkillSupportControls preset={preset} settings={settings} onChange={onChange} disabled={false}/>);
    expect(document.getElementById("support-potent-exposure-summary")!.textContent).toContain("does not grant Exposure");
    expect(screen.queryByRole("button",{name:"Apply support priorities"})).toBeNull();
    rerender(<SkillSupportControls preset={preset} settings={{...settings,supportGemIds:["potent-exposure","fire-exposure"]}} onChange={onChange} disabled={false}/>);
    fireEvent.click(screen.getByRole("button",{name:"Apply support priorities"}));
    expect(onChange.mock.calls.at(-1)![0].preferences).toEqual([{id:"exposureEffect",weight:2}]);
  });
});
