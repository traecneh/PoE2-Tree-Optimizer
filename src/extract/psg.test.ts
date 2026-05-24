import { describe, expect, it } from "vitest";
import { normalizePoe2PassiveTreeData, parsePassiveSkillGraph } from "./psg";

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
