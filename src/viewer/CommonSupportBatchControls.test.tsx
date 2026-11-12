import { fireEvent,render,screen } from "@testing-library/react";
import { describe,expect,it,vi } from "vitest";
import { commonSupportFixtures as fixtures } from "../tree/commonSupportBatch.fixtures";
import { getSkillPreferencePreset } from "../tree/skillPreferencePresets";
import type { PassiveOptimizationSettings } from "../tree/passivePreferences";
import { SkillSupportControls } from "./SkillSupportControls";

describe("45 shared support controls",()=>{
  it.each(fixtures)("selects $name without silently changing priorities, goals or budget",f=>{
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
      const applied=onChange.mock.calls.at(-1)![0];
      expect(applied.preferences[0]).toEqual(settings.preferences[0]);
      expect(applied).toMatchObject({extraPointBudget:8,pointBudgetMode:"all-available",focusSkillId:preset.id,supportGemIds:[f.supportId]});
    }
    rerender(<SkillSupportControls preset={preset} settings={selected} onChange={onChange} disabled={true}/>);
    expect(screen.getByRole("checkbox",{name:"Use "+f.name}).matches(":disabled")).toBe(true);
  });

  it("replaces Rapid Attacks tiers and explains the damage trade-off",()=>{
    const preset=getSkillPreferencePreset("ice-strike")!,onChange=vi.fn();
    const settings:PassiveOptimizationSettings={mode:"weighted",focusSkillId:preset.id,extraPointBudget:5,preferences:[],supportGemIds:["rapid-attacks-ii"]};
    const {rerender}=render(<SkillSupportControls preset={preset} settings={settings} onChange={onChange} disabled={false}/>);
    fireEvent.click(screen.getByRole("checkbox",{name:"Use Rapid Attacks III"}));
    const selected=onChange.mock.calls.at(-1)![0];
    expect(selected.supportGemIds).toEqual(["rapid-attacks-iii"]);
    rerender(<SkillSupportControls preset={preset} settings={selected} onChange={onChange} disabled={false}/>);
    expect(screen.getByText(/35% increased Attack Speed, but 50% less supported damage/)).toBeDefined();
    expect((screen.getByRole("checkbox",{name:"Use Rapid Attacks II"}) as HTMLInputElement).checked).toBe(false);
  });
});
