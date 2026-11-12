import { fireEvent,render,screen } from "@testing-library/react";
import { describe,expect,it,vi } from "vitest";
import { deploymentSupportFixtures as fixtures } from "../tree/deploymentSupportBatch.fixtures";
import { getSkillPreferencePreset } from "../tree/skillPreferencePresets";
import type { PassiveOptimizationSettings } from "../tree/passivePreferences";
import { SkillSupportControls } from "./SkillSupportControls";

describe("45 deployment support controls",()=>{
  it.each(fixtures)("selects $name, preserves manual settings and disables changes while running",f=>{
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

  it("replaces Controlled Hazard when selecting Delayed Reaction",()=>{
    const preset=getSkillPreferencePreset("spearfield")!,onChange=vi.fn();
    const settings:PassiveOptimizationSettings={mode:"weighted",focusSkillId:preset.id,extraPointBudget:5,preferences:[],supportGemIds:["controlled-hazard"]};
    const {rerender}=render(<SkillSupportControls preset={preset} settings={settings} onChange={onChange} disabled={false}/>);
    fireEvent.click(screen.getByRole("checkbox",{name:"Use Delayed Reaction"}));
    const selected=onChange.mock.calls.at(-1)![0];
    expect(selected.supportGemIds).toEqual(["delayed-reaction"]);
    rerender(<SkillSupportControls preset={preset} settings={selected} onChange={onChange} disabled={false}/>);
    expect((screen.getByRole("checkbox",{name:"Use Controlled Hazard"}) as HTMLInputElement).checked).toBe(false);
    expect(screen.getByText(/70% less Hazard Duration/)).toBeDefined();
  });
});
