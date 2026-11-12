import { fireEvent,render,screen } from "@testing-library/react";
import { describe,expect,it,vi } from "vitest";
import { proxyDebuffSupportFixtures as fixtures } from "../tree/proxyDebuffSupportBatch.fixtures";
import { getSkillPreferencePreset } from "../tree/skillPreferencePresets";
import type { PassiveOptimizationSettings } from "../tree/passivePreferences";
import { SkillSupportControls } from "./SkillSupportControls";

describe("45 proxy/debuff support controls",()=>{
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

  it("replaces Font of Blood with Font of Mana rather than stacking both",()=>{
    const preset=getSkillPreferencePreset("shockwave-totem")!,onChange=vi.fn();
    const settings:PassiveOptimizationSettings={mode:"weighted",focusSkillId:preset.id,extraPointBudget:5,preferences:[],supportGemIds:["font-of-blood"]};
    const {rerender}=render(<SkillSupportControls preset={preset} settings={settings} onChange={onChange} disabled={false}/>);
    fireEvent.click(screen.getByRole("checkbox",{name:"Use Font of Mana"}));
    const selected=onChange.mock.calls.at(-1)![0];
    expect(selected.supportGemIds).toEqual(["font-of-mana"]);
    rerender(<SkillSupportControls preset={preset} settings={selected} onChange={onChange} disabled={false}/>);
    expect((screen.getByRole("checkbox",{name:"Use Font of Blood"}) as HTMLInputElement).checked).toBe(false);
    expect(screen.getByText(/Not Mana regeneration or free casting/)).toBeDefined();
  });
});
