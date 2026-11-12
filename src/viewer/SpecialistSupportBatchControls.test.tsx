import {fireEvent,render,screen} from "@testing-library/react";
import {describe,expect,it,vi} from "vitest";
import {specialistSupportFixtures as fixtures} from "../tree/specialistSupportBatch.fixtures";
import {getSkillPreferencePreset} from "../tree/skillPreferencePresets";
import type {PassiveOptimizationSettings} from "../tree/passivePreferences";
import {SkillSupportControls} from "./SkillSupportControls";

describe("final 50 specialist support controls",()=>{
  it.each(fixtures)("selects $name with manual weights intact and respects running state",f=>{
    const preset=getSkillPreferencePreset(f.reviewedSkillIds[0])!,onChange=vi.fn();
    const settings:PassiveOptimizationSettings={mode:"weighted",focusSkillId:preset.id,extraPointBudget:8,pointBudgetMode:"all-available",preferences:[{id:"fireResistance",weight:3}]};
    const {rerender}=render(<SkillSupportControls preset={preset} settings={settings} onChange={onChange} disabled={false}/>);
    fireEvent.click(screen.getByRole("checkbox",{name:"Use "+f.name}));
    const selected=onChange.mock.calls.at(-1)![0];expect(selected).toEqual({...settings,supportGemIds:[f.supportId]});
    rerender(<SkillSupportControls preset={preset} settings={selected} onChange={onChange} disabled={false}/>);
    expect(document.getElementById(`support-${f.supportId}-summary`)?.querySelector("a")?.getAttribute("aria-label")).toBe(f.name+" data reference");
    if(screen.queryByRole("button",{name:"Apply support priorities"})){
      fireEvent.click(screen.getByRole("button",{name:"Apply support priorities"}));expect(onChange.mock.calls.at(-1)![0].preferences[0]).toEqual(settings.preferences[0]);
    }
    rerender(<SkillSupportControls preset={preset} settings={selected} onChange={onChange} disabled={true}/>);
    expect(screen.getByRole("checkbox",{name:"Use "+f.name}).matches(":disabled")).toBe(true);
  });

  it("replaces both Expand families without changing unrelated preferences",()=>{
    const preset=getSkillPreferencePreset("comet")!,onChange=vi.fn();
    const settings:PassiveOptimizationSettings={mode:"weighted",focusSkillId:preset.id,extraPointBudget:5,preferences:[{id:"energyShield",weight:3}],supportGemIds:["unleash","magnified-area-i"]};
    render(<SkillSupportControls preset={preset} settings={settings} onChange={onChange} disabled={false}/>);
    fireEvent.click(screen.getByRole("checkbox",{name:"Use Expand"}));
    expect(onChange.mock.calls.at(-1)![0]).toEqual({...settings,supportGemIds:["expand"]});
  });

  it("warns about an added cooldown without deleting retained selections",()=>{
    const preset=getSkillPreferencePreset("comet")!,onChange=vi.fn();
    const settings:PassiveOptimizationSettings={mode:"weighted",focusSkillId:preset.id,extraPointBudget:5,preferences:[],supportGemIds:["hourglass","spell-echo"]};
    render(<SkillSupportControls preset={preset} settings={settings} onChange={onChange} disabled={false}/>);
    expect(document.getElementById("support-spell-echo-summary")!.textContent).toContain("ineligible");
    expect((screen.getByRole("checkbox",{name:"Use Spell Echo"}) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("button",{name:"Apply support priorities"}));
    expect(onChange.mock.calls.at(-1)![0].preferences).toEqual([{id:"cooldownRecoveryRate",weight:2}]);
  });

  it("keeps Power generation, Plant-hit triggers and critical prohibitions explicit",()=>{
    const onChange=vi.fn(),settings:PassiveOptimizationSettings={mode:"weighted",focusSkillId:"profane-ritual",extraPointBudget:5,preferences:[],supportGemIds:["empowered-sparks-i"]};
    const {rerender}=render(<SkillSupportControls preset={getSkillPreferencePreset("profane-ritual")!} settings={settings} onChange={onChange} disabled={false}/>);
    expect(document.getElementById("support-empowered-sparks-i-summary")!.textContent).toContain("Power Charge");
    rerender(<SkillSupportControls preset={getSkillPreferencePreset("entangle")!} settings={{...settings,focusSkillId:"entangle",supportGemIds:["poison-spores"]}} onChange={onChange} disabled={false}/>);
    expect(document.getElementById("support-poison-spores-summary")!.textContent).toContain("Overgrowth is not the trigger");
    rerender(<SkillSupportControls preset={getSkillPreferencePreset("fireball")!} settings={{...settings,focusSkillId:"fireball",supportGemIds:["volatility","controlled-destruction"]}} onChange={onChange} disabled={false}/>);
    expect(document.getElementById("support-volatility-summary")!.textContent).toContain("cannot generate Volatility");
  });
});
