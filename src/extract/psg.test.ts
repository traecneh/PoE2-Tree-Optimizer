import { describe, expect, it } from "vitest";
import { normalizePoe2PassiveTreeData, parsePassiveSkillGraph } from "./psg";
import { createStatDescriptionFormatter } from "./statDescriptions";

describe("parsePassiveSkillGraph", () => {
  it("parses a version 3 PoE2 passive skill graph", () => {
    const graph = parsePassiveSkillGraph(makePsgFixture());

    expect(graph).toEqual({
      version: 3,
      type: 0,
      orbits: [1, 4],
      rootNodeIds: [100],
      groups: [
        {
          id: "0",
          position: { x: 100, y: 200 },
          groupAssociationKey: 7,
          groupBackgroundOverride: 0,
          isJewelPositionReference: false,
          nodes: [
            {
              id: 100,
              orbit: 0,
              orbitIndex: 0,
              connections: [{ nodeId: 101, orbit: 3 }],
            },
            {
              id: 101,
              orbit: 1,
              orbitIndex: 0,
              connections: [{ nodeId: 100, orbit: 0 }],
            },
          ],
        },
      ],
    });
  });
});

describe("normalizePoe2PassiveTreeData", () => {
  it("combines parsed PSG layout with PassiveSkills rows", () => {
    const graph = normalizePoe2PassiveTreeData({
      gameVersion: "fixture-version",
      sourcePath: "fixture.psg",
      graph: parsePassiveSkillGraph(makePsgFixture()),
      passiveSkills: [
        {
          Id: "start",
          Name: "Class Start",
          PassiveSkillGraphId: 100,
          Stats: [1],
          Stat1Value: 5,
          IsNotable: false,
          IsKeystone: false,
          IsJewelSocket: false,
          IsAttribute: true,
          Icon_DDSFile: "start.dds",
        },
        {
          Id: "notable",
          Name: "Critical Notable",
          PassiveSkillGraphId: 101,
          Stats: [2],
          Stat1Value: 10,
          IsNotable: true,
          IsKeystone: false,
          IsJewelSocket: false,
          IsAttribute: false,
          Icon_DDSFile: "notable.dds",
        },
      ],
    });

    expect(graph.nodes["100"]).toMatchObject({
      name: "Class Start",
      groupId: "0",
      layout: { orbit: 0, orbitIndex: 0 },
      stats: ["stat:1=5"],
      position: { x: 100, y: 200 },
      flags: { classStart: true, attribute: true },
    });
    expect(graph.nodes["101"]).toMatchObject({
      name: "Critical Notable",
      groupId: "0",
      layout: { orbit: 1, orbitIndex: 0 },
      stats: ["stat:2=10"],
      position: { x: 100, y: 118 },
      flags: { notable: true },
    });
    expect(graph.groups["0"].nodeIds).toEqual(["100", "101"]);
    expect(graph.edges).toEqual([{ from: "100", to: "101", connectionOrbit: 3 }]);
    expect(graph.classStarts).toEqual({ "Class Start": "100" });
    expect(graph.bounds).toEqual({ minX: 100, maxX: 100, minY: 118, maxY: 200 });
  });

  it("preserves stat value positions when the stats array has gaps", () => {
    const graph = normalizePoe2PassiveTreeData({
      gameVersion: "fixture-version",
      sourcePath: "fixture.psg",
      graph: parsePassiveSkillGraph(makePsgFixture()),
      passiveSkills: [
        {
          Id: "start",
          Name: "Class Start",
          PassiveSkillGraphId: 100,
          Stats: [null, 2],
          Stat1Value: 5,
          Stat2Value: 10,
        },
      ],
    });

    expect(graph.nodes["100"].stats).toEqual(["stat:2=10"]);
  });

  it("omits formatter-suppressed stat lines", () => {
    const graph = normalizePoe2PassiveTreeData({
      gameVersion: "fixture-version",
      sourcePath: "fixture.psg",
      graph: parsePassiveSkillGraph(makePsgFixture()),
      passiveSkills: [
        {
          Id: "start",
          Name: "Class Start",
          PassiveSkillGraphId: 100,
          Stats: [448],
          Stat1Value: 1,
        },
      ],
      statFormatter: () => "",
    });

    expect(graph.nodes["100"].stats).toEqual([]);
  });

  it("uses a stat formatter when one is provided", () => {
    const graph = normalizePoe2PassiveTreeData({
      gameVersion: "fixture-version",
      sourcePath: "fixture.psg",
      graph: parsePassiveSkillGraph(makePsgFixture()),
      passiveSkills: [
        {
          Id: "start",
          Name: "Class Start",
          PassiveSkillGraphId: 100,
          Stats: [17989],
          Stat1Value: 15,
        },
      ],
      statFormatter: createStatDescriptionFormatter({
        stats: [{ _index: 17989, Id: "shock_chance_+%" }],
        descriptions: [
          `
description
\t1 shock_chance_+%
\t1
\t\t# "{0}% increased chance to [Shock]"
`,
        ],
      }),
    });

    expect(graph.nodes["100"].stats).toEqual(["15% increased chance to Shock"]);
  });

  it("attaches mastery choices without treating every choice as an active stat", () => {
    const graph = normalizePoe2PassiveTreeData({
      gameVersion: "fixture-version",
      sourcePath: "fixture.psg",
      graph: parsePassiveSkillGraph(makePsgFixture()),
      passiveSkills: [
        {
          Id: "start",
          Name: "Class Start",
          PassiveSkillGraphId: 100,
          Stats: [1],
          Stat1Value: 5,
        },
        {
          Id: "mastery_attack1",
          Name: "Attack Mastery",
          PassiveSkillGraphId: 101,
          Stats: [],
          MasteryGroup: 4,
        },
      ],
      masteryGroups: [
        {
          _index: 4,
          Id: "Attack",
          MasteryEffects: [24, 25],
        },
      ],
      masteryEffects: [
        {
          _index: 24,
          Id: "Attack1",
          Stats: [11],
          Stat1Value: 12,
        },
        {
          _index: 25,
          Id: "Attack2",
          Stats: [12, 13],
          Stat1Value: 20,
          Stat2Value: 5,
        },
      ],
    });

    expect(graph.nodes["101"].stats).toEqual([]);
    expect(graph.nodes["101"].flags.mastery).toBe(true);
    expect(graph.nodes["101"].masteryEffects).toEqual([
      { id: "Attack1", stats: ["stat:11=12"] },
      { id: "Attack2", stats: ["stat:12=20", "stat:13=5"] },
    ]);
  });

  it("attaches canonical ascendancy metadata from the Ascendancy table", () => {
    const graph = normalizePoe2PassiveTreeData({
      gameVersion: "fixture-version",
      sourcePath: "fixture.psg",
      graph: parsePassiveSkillGraph(makePsgFixture()),
      passiveSkills: [
        {
          Id: "mercenary_start",
          Name: "Mercenary",
          PassiveSkillGraphId: 100,
        },
        {
          Id: "ascendancy_gambler_start",
          Name: "Gambler",
          PassiveSkillGraphId: 101,
          Ascendancy: 7,
          IsAscendancyStartingNode: true,
        },
      ],
      ascendancies: [
        {
          _index: 7,
          Id: "Mercenary3",
          Name: "Gemling Legionnaire",
          Disabled: false,
        },
      ],
    });

    expect(graph.nodes["101"]).toMatchObject({
      name: "Gambler",
      flags: { classStart: true, ascendancy: true },
      ascendancy: {
        id: "Mercenary3",
        name: "Gemling Legionnaire",
        className: "Mercenary",
        disabled: false,
        startNode: true,
      },
    });
  });

  it("does not create passive icon art for empty icon fields", () => {
    const graph = normalizePoe2PassiveTreeData({
      gameVersion: "fixture-version",
      sourcePath: "fixture.psg",
      graph: parsePassiveSkillGraph(makePsgFixture()),
      passiveSkills: [
        {
          Id: "start",
          Name: "Class Start",
          PassiveSkillGraphId: 100,
          Icon_DDSFile: "",
        },
      ],
    });

    expect(graph.nodes["100"].art).toBeUndefined();
  });

  it("filters disconnected non-start nodes from the normalized graph", () => {
    const graph = normalizePoe2PassiveTreeData({
      gameVersion: "fixture-version",
      sourcePath: "fixture.psg",
      graph: {
        version: 3,
        type: 0,
        orbits: [1, 4],
        rootNodeIds: [100],
        groups: [
          {
            id: "0",
            position: { x: 100, y: 200 },
            groupAssociationKey: 7,
            groupBackgroundOverride: 0,
            isJewelPositionReference: false,
            nodes: [
              {
                id: 100,
                orbit: 0,
                orbitIndex: 0,
                connections: [{ nodeId: 101, orbit: 3 }],
              },
              {
                id: 101,
                orbit: 1,
                orbitIndex: 0,
                connections: [{ nodeId: 100, orbit: 0 }],
              },
              {
                id: 102,
                orbit: 1,
                orbitIndex: 1,
                connections: [],
              },
            ],
          },
        ],
      },
      passiveSkills: [
        {
          Id: "start",
          Name: "Class Start",
          PassiveSkillGraphId: 100,
        },
        {
          Id: "connected",
          Name: "Connected Notable",
          PassiveSkillGraphId: 101,
          IsNotable: true,
        },
        {
          Id: "disconnected",
          Name: "Disconnected Notable",
          PassiveSkillGraphId: 102,
          IsNotable: true,
        },
      ],
    });

    expect(graph.nodes["100"]).toBeDefined();
    expect(graph.nodes["101"]).toBeDefined();
    expect(graph.nodes["102"]).toBeUndefined();
    expect(graph.groups["0"].nodeIds).toEqual(["100", "101"]);
    expect(graph.edges).toEqual([{ from: "100", to: "101", connectionOrbit: 3 }]);
    expect(graph.bounds).toEqual({ minX: 100, maxX: 100, minY: 118, maxY: 200 });
  });
});

function makePsgFixture(): Buffer {
  const chunks: Buffer[] = [];
  const u8 = (value: number) => chunks.push(Buffer.from([value]));
  const u32 = (value: number) => {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32LE(value);
    chunks.push(buffer);
  };
  const i32 = (value: number) => {
    const buffer = Buffer.alloc(4);
    buffer.writeInt32LE(value);
    chunks.push(buffer);
  };
  const f32 = (value: number) => {
    const buffer = Buffer.alloc(4);
    buffer.writeFloatLE(value);
    chunks.push(buffer);
  };

  u8(3);
  u8(0);
  u8(2);
  u8(1);
  u8(4);

  u32(1);
  u32(100);
  u32(0);

  u32(1);
  f32(100);
  f32(200);
  u32(7);
  u32(0);
  u8(0);
  u32(2);

  u32(100);
  u32(0);
  u32(0);
  u32(1);
  u32(101);
  i32(3);

  u32(101);
  u32(1);
  u32(0);
  u32(1);
  u32(100);
  i32(0);

  return Buffer.concat(chunks);
}
