import { fireEvent,render,screen } from "@testing-library/react";
import { describe,expect,it,vi } from "vitest";
import { resourceSupportFixtures as fixtures } from "../tree/resourceSupportBatch.fixtures";
import { getSkillPreferencePreset } from "../tree/skillPreferencePresets";
import type { PassiveOptimizationSettings } from "../tree/passivePreferences";
import { SkillSupportControls } from "./SkillSupportControls";

describe("50 resource, recovery and defensive utility support controls",()=>{
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

  it("replaces Cannibalism tiers instead of stacking rewards or reservation",()=>{
    const preset=getSkillPreferencePreset("berserk")!,onChange=vi.fn();
    const settings:PassiveOptimizationSettings={mode:"weighted",focusSkillId:preset.id,extraPointBudget:5,preferences:[],supportGemIds:["cannibalism-i"]};
    const {rerender}=render(<SkillSupportControls preset={preset} settings={settings} onChange={onChange} disabled={false}/>);
    fireEvent.click(screen.getByRole("checkbox",{name:"Use Cannibalism II"}));
    const selected=onChange.mock.calls.at(-1)![0];
    expect(selected.supportGemIds).toEqual(["cannibalism-ii"]);
    rerender(<SkillSupportControls preset={preset} settings={selected} onChange={onChange} disabled={false}/>);
    expect((screen.getByRole("checkbox",{name:"Use Cannibalism I"}) as HTMLInputElement).checked).toBe(false);
    fireEvent.click(screen.getByRole("button",{name:"Apply support priorities"}));
    expect(onChange.mock.calls.at(-1)![0].preferences).toEqual([{id:"lifeRecoveryOnKill",weight:2}]);
  });

  it("warns that retained charge-consumer links cannot bypass Inhibitor",()=>{
    const preset=getSkillPreferencePreset("bonestorm")!;
    render(<SkillSupportControls preset={preset} settings={{mode:"weighted",focusSkillId:preset.id,extraPointBudget:5,preferences:[],supportGemIds:["inhibitor","perpetual-charge"]}} onChange={vi.fn()} disabled={false}/>);
    expect(document.getElementById("support-perpetual-charge-summary")!.textContent).toContain("prevents charge/Infusion consumption");
    expect(screen.queryByRole("button",{name:"Apply support priorities"})).toBeNull();
  });

  it("explains allied Remnant recipients instead of personal delayed recovery",()=>{
    const preset=getSkillPreferencePreset("mana-remnants")!,onChange=vi.fn();
    const settings:PassiveOptimizationSettings={mode:"weighted",focusSkillId:preset.id,extraPointBudget:5,preferences:[{id:"energyShield",weight:3}],supportGemIds:["selfless-remnants","remnant-potency-iii"]};
    render(<SkillSupportControls preset={preset} settings={settings} onChange={onChange} disabled={false}/>);
    expect(document.getElementById("support-remnant-potency-iii-summary")!.textContent).toContain("instead of the player");
    fireEvent.click(screen.getByRole("button",{name:"Apply support priorities"}));
    expect(onChange.mock.calls.at(-1)![0].preferences).toEqual([...settings.preferences,{id:"presenceArea",weight:2}]);
  });
});
