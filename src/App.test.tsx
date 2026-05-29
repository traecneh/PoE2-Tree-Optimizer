import { deflateSync } from "node:zlib";
import { act, configure, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { sampleGraph } from "./tree/sampleGraph";
import type { TreeGraph } from "./tree/types";

configure({ asyncUtilTimeout: 3000 });

describe("App", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  function stubTreeFetch() {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
  }

  function stubTreeFetchWithGraph(graph: TreeGraph) {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(graph),
    })));
  }

  function stubTreeFetchFailure() {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({}),
    })));
  }

  it("renders the Boomslang title without graph metadata in the header", () => {
    stubTreeFetch();

    render(<App />);

    expect(screen.getByRole("heading", { name: "PoE2 Tree Optimizer for Boomslang" })).not.toBeNull();
    expect(screen.getByText("Tree data: PoE2 0.5.0")).not.toBeNull();
    expect(screen.queryByText(/nodes, .*links, version/i)).toBeNull();
  });

  it("renders header help text with the main site actions", () => {
    stubTreeFetch();

    render(<App />);

    const helpButton = screen.getByRole("button", { name: "How to use the site" });
    const tooltip = screen.getByRole("tooltip", { name: "Site usage help" });

    expect(helpButton.getAttribute("aria-describedby")).toBe("site-help-tooltip");
    expect(tooltip.textContent).toContain("Ctrl + left click");
    expect(tooltip.textContent).toContain("Hover path preview");
    expect(tooltip.textContent).toContain("Optimize route");
    expect(tooltip.textContent).toContain("New build");
    expect(tooltip.textContent).toContain("Reset allocation");
    expect(tooltip.textContent).toContain("PoB");
  });

  it("groups header controls by build, tree setup, and allocation tasks", () => {
    stubTreeFetch();

    render(<App />);

    const buildGroup = screen.getByRole("group", { name: "Build management" });
    const savedBuildSelect = within(buildGroup).getByLabelText("Saved build");
    expect(savedBuildSelect).not.toBeNull();
    expectTooltipText(savedBuildSelect, "Load a saved build");
    expectTooltipText(within(buildGroup).getByLabelText("Build name"), "Name used when saving");
    expectTooltipText(within(buildGroup).getByRole("button", { name: "New build" }), "Start a new unsaved build");
    expectTooltipText(within(buildGroup).getByRole("button", { name: "Save build" }), "Save the current build");
    expectTooltipText(within(buildGroup).getByRole("button", { name: "Delete build" }), "Delete the selected saved build");

    const treeSetupGroup = screen.getByRole("group", { name: "Tree setup" });
    expectTooltipText(within(treeSetupGroup).getByLabelText("Path start"), "class or ascendancy start");
    expectTooltipText(within(treeSetupGroup).getByLabelText("Node size"), "Scale passive node icons");
    expectTooltipText(within(treeSetupGroup).getByLabelText("Hover path preview"), "temporary path preview");

    const allocationGroup = screen.getByRole("group", { name: "Allocation summary" });
    expect(within(allocationGroup).getByText("Allocated 0/123")).not.toBeNull();
    expectTooltipText(within(allocationGroup).getByRole("button", { name: "Reset allocation" }), "Clear committed allocation");
  });

  function endpointFixtureGraph(): TreeGraph {
    return {
      ...sampleGraph,
      gameVersion: "endpoint-fixture",
      nodes: {
        ...sampleGraph.nodes,
        near_start_branch: {
          id: "near_start_branch",
          groupId: "g1",
          name: "Near Start Branch",
          stats: ["10% increased Branch Damage"],
          position: { x: -120, y: 0 },
          flags: { notable: true },
        },
      },
      edges: [
        ...sampleGraph.edges,
        { from: "mercenary_start", to: "near_start_branch" },
      ],
      bounds: { ...sampleGraph.bounds, minX: -120 },
    };
  }

  function searchSortFixtureGraph(): TreeGraph {
    return {
      ...sampleGraph,
      gameVersion: "search-sort-fixture",
      nodes: {
        ...sampleGraph.nodes,
        close_critical: {
          id: "close_critical",
          groupId: "g1",
          name: "Close Critical",
          stats: ["10% increased Critical Hit Chance"],
          position: { x: 80, y: 80 },
          flags: { small: true },
        },
      },
      groups: {
        ...sampleGraph.groups,
        g1: {
          ...sampleGraph.groups.g1,
          nodeIds: [...sampleGraph.groups.g1.nodeIds, "close_critical"],
        },
      },
      edges: [
        ...sampleGraph.edges,
        { from: "mercenary_start", to: "close_critical" },
      ],
      bounds: { ...sampleGraph.bounds, maxY: 90 },
    };
  }

  function repeatedMinionFixtureGraph(): TreeGraph {
    return {
      ...sampleGraph,
      gameVersion: "repeated-minion-fixture",
      nodes: {
        ...sampleGraph.nodes,
        minion_damage_one: {
          id: "minion_damage_one",
          groupId: "g1",
          name: "Minion Damage One",
          stats: ["15% increased Minion Damage"],
          position: { x: 80, y: 100 },
          flags: { small: true },
        },
        minion_damage_two: {
          id: "minion_damage_two",
          groupId: "g1",
          name: "Minion Damage Two",
          stats: ["15% increased Minion Damage"],
          position: { x: 160, y: 100 },
          flags: { small: true },
        },
        minion_damage_three: {
          id: "minion_damage_three",
          groupId: "g1",
          name: "Minion Damage Three",
          stats: ["15% increased Minion Damage"],
          position: { x: 240, y: 100 },
          flags: { small: true },
        },
        minion_damage_notable: {
          id: "minion_damage_notable",
          groupId: "g1",
          name: "Minion Commander",
          stats: ["25% increased Minion Damage"],
          position: { x: 320, y: 100 },
          flags: { notable: true },
        },
      },
      groups: {
        ...sampleGraph.groups,
        g1: {
          ...sampleGraph.groups.g1,
          nodeIds: [
            ...sampleGraph.groups.g1.nodeIds,
            "minion_damage_one",
            "minion_damage_two",
            "minion_damage_three",
            "minion_damage_notable",
          ],
        },
      },
      edges: [
        ...sampleGraph.edges,
        { from: "mercenary_start", to: "minion_damage_one" },
        { from: "minion_damage_one", to: "minion_damage_two" },
        { from: "minion_damage_two", to: "minion_damage_three" },
        { from: "minion_damage_three", to: "minion_damage_notable" },
      ],
      bounds: { ...sampleGraph.bounds, maxY: 120 },
    };
  }

  it("shows a clear missing data notice when the real tree graph cannot be loaded", async () => {
    stubTreeFetchFailure();

    render(<App />);

    expect(await screen.findByText(/Real tree data is unavailable/i)).not.toBeNull();
    expect(screen.getByText(/run npm run prepare-data/i)).not.toBeNull();
  });

  it("marks the passive tree viewer as loading before the real graph is ready", () => {
    stubTreeFetch();

    render(<App />);

    const viewer = screen.getByRole("region", { name: "Passive tree viewer" });
    expect(viewer.getAttribute("aria-busy")).toBe("true");
    expect(viewer.classList.contains("tree-viewer-shell-loading")).toBe(true);
    expect(screen.getByText("Loading passive tree...")).not.toBeNull();
  });

  function pobImportFixtureGraph(): TreeGraph {
    return {
      schemaVersion: 1,
      gameVersion: "pob-import-fixture",
      extractedAt: "2026-05-26T00:00:00.000Z",
      source: { kind: "fixture", path: "src/App.test.tsx" },
      nodes: {
        "100": {
          id: "100",
          name: "Start",
          stats: ["Starting point"],
          position: { x: 0, y: 0 },
          flags: { classStart: true },
        },
        "101": {
          id: "101",
          name: "Required Notable",
          stats: ["20% increased Damage"],
          position: { x: 200, y: 0 },
          flags: { notable: true },
        },
        "102": {
          id: "102",
          name: "Pathing",
          stats: ["5% increased Damage"],
          position: { x: 100, y: 0 },
          flags: { small: true },
        },
        "103": {
          id: "103",
          name: "Imported Jewel",
          stats: [],
          position: { x: 300, y: 0 },
          flags: { jewelSocket: true },
        },
        "104": {
          id: "104",
          name: "Unused Keystone",
          stats: ["A defining rule"],
          position: { x: 400, y: 0 },
          flags: { keystone: true },
        },
      },
      groups: {},
      edges: [
        { from: "100", to: "102" },
        { from: "102", to: "101" },
        { from: "101", to: "103" },
        { from: "103", to: "104" },
      ],
      classStarts: { Test: "100" },
      bounds: { minX: 0, maxX: 400, minY: 0, maxY: 0 },
    };
  }

  function pobClassStartImportFixtureGraph(): TreeGraph {
    return {
      schemaVersion: 1,
      gameVersion: "pob-class-start-import-fixture",
      extractedAt: "2026-05-28T00:00:00.000Z",
      source: { kind: "fixture", path: "src/App.test.tsx" },
      nodes: {
        "100": {
          id: "100",
          name: "WITCH",
          stats: ["Starting point"],
          position: { x: 0, y: -100 },
          flags: { classStart: true },
        },
        "200": {
          id: "200",
          name: "RANGER",
          stats: ["Starting point"],
          position: { x: 100, y: 0 },
          flags: { classStart: true },
        },
        "201": {
          id: "201",
          name: "Required Huntress Notable",
          stats: ["20% increased Spear Damage"],
          position: { x: 200, y: 0 },
          flags: { notable: true },
        },
        "300": {
          id: "300",
          name: "MARAUDER",
          stats: ["Starting point"],
          position: { x: -100, y: 0 },
          flags: { classStart: true },
        },
        "400": {
          id: "400",
          name: "DUELIST",
          stats: ["Starting point"],
          position: { x: 0, y: 100 },
          flags: { classStart: true },
        },
        "500": {
          id: "500",
          name: "SIX",
          stats: ["Starting point"],
          position: { x: 100, y: -100 },
          flags: { classStart: true },
        },
        "600": {
          id: "600",
          name: "TEMPLAR",
          stats: ["Starting point"],
          position: { x: -100, y: -100 },
          flags: { classStart: true },
        },
      },
      groups: {},
      edges: [
        { from: "200", to: "201" },
      ],
      classStarts: {
        WITCH: "100",
        RANGER: "200",
        MARAUDER: "300",
        DUELIST: "400",
        SIX: "500",
        TEMPLAR: "600",
      },
      bounds: { minX: -100, maxX: 200, minY: -100, maxY: 100 },
    };
  }

  function poe2ClassStartFixtureGraph(): TreeGraph {
    return {
      schemaVersion: 1,
      gameVersion: "poe2-class-start-fixture",
      extractedAt: "2026-05-27T00:00:00.000Z",
      source: { kind: "fixture", path: "src/App.test.tsx" },
      nodes: {
        witch_start: {
          id: "witch_start",
          name: "WITCH",
          stats: ["Starting point"],
          position: { x: 0, y: -100 },
          flags: { classStart: true },
        },
        ranger_start: {
          id: "ranger_start",
          name: "RANGER",
          stats: ["Starting point"],
          position: { x: 100, y: 0 },
          flags: { classStart: true },
        },
        marauder_start: {
          id: "marauder_start",
          name: "MARAUDER",
          stats: ["Starting point"],
          position: { x: -100, y: 0 },
          flags: { classStart: true },
        },
        duelist_start: {
          id: "duelist_start",
          name: "DUELIST",
          stats: ["Starting point"],
          position: { x: 0, y: 100 },
          flags: { classStart: true },
        },
        six_start: {
          id: "six_start",
          name: "SIX",
          stats: ["Starting point"],
          position: { x: 100, y: -100 },
          flags: { classStart: true },
        },
        templar_start: {
          id: "templar_start",
          name: "TEMPLAR",
          stats: ["Starting point"],
          position: { x: -100, y: -100 },
          flags: { classStart: true },
        },
      },
      groups: {},
      edges: [],
      classStarts: {
        WITCH: "witch_start",
        RANGER: "ranger_start",
        MARAUDER: "marauder_start",
        DUELIST: "duelist_start",
        SIX: "six_start",
        TEMPLAR: "templar_start",
      },
      bounds: { minX: -100, maxX: 100, minY: -100, maxY: 100 },
    };
  }

  function poe2AscendancyFixtureGraph(): TreeGraph {
    const graph = poe2ClassStartFixtureGraph();
    const ascendancyNodes = Object.fromEntries(
      Array.from({ length: 9 }, (_, index) => {
        const nodeNumber = index + 1;
        const nodeId = `gemling_${nodeNumber}`;
        return [nodeId, {
          id: nodeId,
          name: `Gemling Passive ${nodeNumber}`,
          stats: [`${nodeNumber}% increased Gemling Power`],
          position: { x: 1000 + nodeNumber * 80, y: 1000 },
          flags: { small: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary3",
            name: "Gemling Legionnaire",
            className: "Mercenary",
            disabled: false,
          },
        }];
      }),
    );

    return {
      ...graph,
      gameVersion: "poe2-ascendancy-fixture",
      nodes: {
        ...graph.nodes,
        gemling_start: {
          id: "gemling_start",
          name: "Gambler",
          stats: [],
          position: { x: 1000, y: 1000 },
          flags: { classStart: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary3",
            name: "Gemling Legionnaire",
            className: "Mercenary",
            disabled: false,
            startNode: true,
          },
        },
        ...ascendancyNodes,
        witchhunter_passive: {
          id: "witchhunter_passive",
          name: "Witchhunter Passive",
          stats: ["10% increased Witchhunter Power"],
          position: { x: 1200, y: 1200 },
          flags: { notable: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary1",
            name: "Witchhunter",
            className: "Mercenary",
            disabled: false,
          },
        },
        implanted_gems: {
          id: "implanted_gems",
          name: "Implanted Gems",
          stats: [],
          position: { x: 900, y: 1100 },
          flags: { notable: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary3",
            name: "Gemling Legionnaire",
            className: "Mercenary",
            disabled: false,
          },
        },
        neurological_implants: {
          id: "neurological_implants",
          name: "Neurological Implants",
          stats: ["+2 to Level of all Skills with an Intelligence requirement"],
          position: { x: 980, y: 1180 },
          flags: { small: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary3",
            name: "Gemling Legionnaire",
            className: "Mercenary",
            disabled: false,
          },
        },
        bolstering_implants: {
          id: "bolstering_implants",
          name: "Bolstering Implants",
          stats: ["+2 to Level of all Skills with a Strength requirement"],
          position: { x: 900, y: 1200 },
          flags: { small: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary3",
            name: "Gemling Legionnaire",
            className: "Mercenary",
            disabled: false,
          },
        },
        motoric_implants: {
          id: "motoric_implants",
          name: "Motoric Implants",
          stats: ["+2 to Level of all Skills with a Dexterity requirement"],
          position: { x: 820, y: 1180 },
          flags: { small: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary3",
            name: "Gemling Legionnaire",
            className: "Mercenary",
            disabled: false,
          },
        },
      },
      edges: [
        ...graph.edges,
        { from: "duelist_start", to: "gemling_start" },
        { from: "gemling_start", to: "gemling_1" },
        ...Array.from({ length: 8 }, (_, index) => ({
          from: `gemling_${index + 1}`,
          to: `gemling_${index + 2}`,
        })),
        { from: "gemling_1", to: "implanted_gems" },
        { from: "implanted_gems", to: "neurological_implants" },
        { from: "implanted_gems", to: "bolstering_implants" },
        { from: "implanted_gems", to: "motoric_implants" },
      ],
      bounds: { minX: -100, maxX: 1800, minY: -100, maxY: 1300 },
    };
  }

  function poe2OracleGatedFixtureGraph(): TreeGraph {
    const graph = poe2ClassStartFixtureGraph();

    return {
      ...graph,
      gameVersion: "poe2-oracle-gated-fixture",
      nodes: {
        ...graph.nodes,
        oracle_start: {
          id: "oracle_start",
          name: "Oracle",
          stats: [],
          position: { x: -1000, y: 1000 },
          flags: { classStart: true, ascendancy: true },
          ascendancy: {
            id: "Druid1",
            name: "Oracle",
            className: "Druid",
            disabled: false,
            startNode: true,
          },
        },
        oracle_unseen_path: {
          id: "oracle_unseen_path",
          name: "The Unseen Path",
          stats: ["Walk the Paths Not Taken"],
          position: { x: -920, y: 1000 },
          flags: { notable: true, ascendancy: true },
          ascendancy: {
            id: "Druid1",
            name: "Oracle",
            className: "Druid",
            disabled: false,
          },
        },
        comradery: {
          id: "comradery",
          name: "Comradery",
          stats: ["30% increased Damage", "Minions deal 30% increased Damage"],
          position: { x: -140, y: -100 },
          flags: { notable: true },
          visibility: {
            requiredAscendancy: {
              id: "Druid1",
              name: "Oracle",
              className: "Druid",
            },
            unlockNodeId: "oracle_unseen_path",
            unlockNodeName: "The Unseen Path",
          },
        },
      },
      edges: [
        ...graph.edges,
        { from: "templar_start", to: "oracle_start" },
        { from: "oracle_start", to: "oracle_unseen_path" },
        { from: "templar_start", to: "comradery" },
      ],
      bounds: { minX: -1100, maxX: 100, minY: -100, maxY: 1100 },
    };
  }

  function pobAscendancyImportFixtureGraph(): TreeGraph {
    return {
      schemaVersion: 1,
      gameVersion: "pob-ascendancy-import-fixture",
      extractedAt: "2026-05-26T00:00:00.000Z",
      source: { kind: "fixture", path: "src/App.test.tsx" },
      nodes: {
        "1000": {
          id: "1000",
          name: "DUELIST",
          stats: [],
          position: { x: 0, y: 0 },
          flags: { classStart: true },
        },
        "2000": {
          id: "2000",
          name: "Gambler",
          stats: [],
          position: { x: 1000, y: 1000 },
          flags: { classStart: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary3",
            name: "Gemling Legionnaire",
            className: "Mercenary",
            disabled: false,
            startNode: true,
          },
        },
        "2001": {
          id: "2001",
          name: "Gemling Passive 1",
          stats: ["1% increased Gemling Power"],
          position: { x: 1080, y: 1000 },
          flags: { small: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary3",
            name: "Gemling Legionnaire",
            className: "Mercenary",
            disabled: false,
          },
        },
        "2002": {
          id: "2002",
          name: "Gemling Passive 2",
          stats: ["2% increased Gemling Power"],
          position: { x: 1160, y: 1000 },
          flags: { small: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary3",
            name: "Gemling Legionnaire",
            className: "Mercenary",
            disabled: false,
          },
        },
        "2003": {
          id: "2003",
          name: "Gemling Passive 3",
          stats: ["3% increased Gemling Power"],
          position: { x: 1240, y: 1000 },
          flags: { small: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary3",
            name: "Gemling Legionnaire",
            className: "Mercenary",
            disabled: false,
          },
        },
        "2010": {
          id: "2010",
          name: "Implanted Gems",
          stats: [],
          position: { x: 1080, y: 1080 },
          flags: { notable: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary3",
            name: "Gemling Legionnaire",
            className: "Mercenary",
            disabled: false,
          },
        },
        "2011": {
          id: "2011",
          name: "Neurological Implants",
          stats: ["+2 to Level of all Skills with an Intelligence requirement"],
          position: { x: 1160, y: 1160 },
          flags: { small: true, ascendancy: true },
          ascendancy: {
            id: "Mercenary3",
            name: "Gemling Legionnaire",
            className: "Mercenary",
            disabled: false,
          },
        },
      },
      groups: {},
      edges: [
        { from: "1000", to: "2000" },
        { from: "2000", to: "2001" },
        { from: "2001", to: "2002" },
        { from: "2002", to: "2003" },
        { from: "2001", to: "2010" },
        { from: "2010", to: "2011" },
      ],
      classStarts: { DUELIST: "1000" },
      bounds: { minX: 0, maxX: 1300, minY: 0, maxY: 1200 },
    };
  }

  function changePassiveSearch(query: string) {
    const input = screen.getByLabelText("Passive search") as HTMLInputElement;
    fireEvent.change(input, { target: { value: query } });
    expect(input.value).toBe(query);
  }

  function enableHoverPathPreview() {
    const toggle = screen.getByLabelText("Hover path preview") as HTMLInputElement;
    fireEvent.click(toggle);
    expect(toggle.checked).toBe(true);
  }

  function saveCurrentBuildAs(name: string) {
    fireEvent.change(screen.getByLabelText("Build name"), { target: { value: name } });
    fireEvent.click(screen.getByRole("button", { name: "Save build" }));
  }

  function selectSavedBuild(name: string) {
    const savedBuildSelect = screen.getByLabelText("Saved build") as HTMLSelectElement;
    const option = Array.from(savedBuildSelect.options).find((currentOption) => currentOption.textContent === name);
    expect(option).toBeDefined();
    fireEvent.change(savedBuildSelect, { target: { value: option?.value } });
  }

  it("lets the viewer node size be adjusted", () => {
    stubTreeFetch();

    render(<App />);

    const classStart = screen.getByRole("button", { name: "Mercenary" });
    expect((screen.getByLabelText("Node size") as HTMLSelectElement).value).toBe("3");
    expect(classStart.querySelector(".node-core")?.getAttribute("r")).toBe("78");

    fireEvent.change(screen.getByLabelText("Node size"), { target: { value: "1" } });

    expect(classStart.querySelector(".node-core")?.getAttribute("r")).toBe("26");
  });

  it("resets pending allocation previews from the header", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Jewel Socket" }));

    expect(document.querySelectorAll(".tree-edge.allocation-path")).toHaveLength(3);

    const resetButton = screen.getByRole("button", { name: "Reset allocation" }) as HTMLButtonElement;
    expect(resetButton.disabled).toBe(false);

    fireEvent.click(resetButton);

    expect(screen.getByText("Allocated 0/123")).not.toBeNull();
    expect(document.querySelectorAll(".tree-edge.allocation-path")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Projectile Damage" }).classList.contains("allocation-path")).toBe(false);
  });

  it("does not show internal debug overlay controls in the header", () => {
    stubTreeFetch();

    render(<App />);

    expect(screen.queryByLabelText("Node IDs")).toBeNull();
    expect(screen.queryByLabelText("Missing stats")).toBeNull();
    expect(screen.queryByLabelText("Orphans")).toBeNull();
    expect(screen.queryByLabelText("Edge routes")).toBeNull();
    expect(screen.queryByLabelText("Route labels")).toBeNull();
  });

  it("summarizes the currently visible allocation preview and committed path", () => {
    stubTreeFetch();

    render(<App />);

    const summary = screen.getByRole("complementary", { name: "Build summary" });
    expect(within(summary).getByText("No allocated passives yet.")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));

    expect(within(summary).getByText("2 allocated points")).not.toBeNull();
    expect(within(summary).getByText("12% increased Projectile Damage")).not.toBeNull();
    expect(within(summary).getByText("25% increased Critical Hit Chance")).not.toBeNull();
    expect(screen.getByText("Allocated 0/123")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Allocate path" }));

    expect(within(summary).getByText("2 allocated points")).not.toBeNull();
    expect(screen.getByText("Allocated 2/123")).not.toBeNull();
  });

  it("adds any non-start passive as a build goal with Ctrl-click without pathing to it", () => {
    stubTreeFetch();

    render(<App />);

    const smallPassive = screen.getByRole("button", { name: "Projectile Damage" });

    fireEvent.pointerDown(smallPassive, { pointerId: 1, button: 0, clientX: 100, clientY: 100, ctrlKey: true });
    fireEvent.pointerUp(screen.getByRole("img", { name: "PoE2 passive skill tree" }), { pointerId: 1 });

    const buildGoals = screen.getByRole("region", { name: "Build goals" });
    expect(within(buildGoals).getByText("Projectile Damage")).not.toBeNull();
    expect(within(buildGoals).getByText("Passive · 1 point from allocation")).not.toBeNull();
    expect(smallPassive.classList.contains("build-goal")).toBe(true);
    expect(smallPassive.classList.contains("allocation-path")).toBe(false);
    expect(document.querySelectorAll(".tree-edge.allocation-path")).toHaveLength(0);
  });

  it("removes a build goal when Ctrl-clicking the same map node again", () => {
    stubTreeFetch();

    render(<App />);

    const smallPassive = screen.getByRole("button", { name: "Projectile Damage" });
    const tree = screen.getByRole("img", { name: "PoE2 passive skill tree" });

    fireEvent.pointerDown(smallPassive, { pointerId: 1, button: 0, clientX: 100, clientY: 100, ctrlKey: true });
    fireEvent.pointerUp(tree, { pointerId: 1 });

    const buildGoals = screen.getByRole("region", { name: "Build goals" });
    expect(within(buildGoals).getByText("Projectile Damage")).not.toBeNull();
    expect(smallPassive.classList.contains("build-goal")).toBe(true);

    fireEvent.pointerDown(smallPassive, { pointerId: 2, button: 0, clientX: 100, clientY: 100, ctrlKey: true });
    fireEvent.pointerUp(tree, { pointerId: 2 });

    expect(within(buildGoals).queryByText("Projectile Damage")).toBeNull();
    expect(within(buildGoals).getByText("No build goals selected.")).not.toBeNull();
    expect(smallPassive.classList.contains("build-goal")).toBe(false);
  });

  it("saves and loads named builds from the header", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    fireEvent.click(screen.getByRole("button", { name: "Add build goal" }));
    fireEvent.click(screen.getByRole("button", { name: "Allocate path" }));
    saveCurrentBuildAs("Crit starter");

    expect(screen.getByRole("status").textContent).toBe("Saved Crit starter");
    expect((screen.getByLabelText("Saved build") as HTMLSelectElement).selectedOptions[0]?.textContent).toBe("Crit starter");

    fireEvent.click(screen.getByRole("button", { name: "New build" }));

    expect(screen.getByText("Allocated 0/123")).not.toBeNull();
    expect((screen.getByLabelText("Build name") as HTMLInputElement).value).toBe("");
    expect(within(screen.getByRole("region", { name: "Build goals" })).getByText("No build goals selected.")).not.toBeNull();

    selectSavedBuild("Crit starter");

    expect(screen.getByText("Allocated 2/123")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Precise Shot" }).classList.contains("allocated")).toBe(true);
    expect(within(screen.getByRole("region", { name: "Build goals" })).getByText("Precise Shot")).not.toBeNull();
    expect((screen.getByLabelText("Build name") as HTMLInputElement).value).toBe("Crit starter");
  });

  it("shows saved build feedback as a temporary toast when saving the same build again", () => {
    vi.useFakeTimers();
    stubTreeFetch();

    render(<App />);

    saveCurrentBuildAs("Crit starter");

    const buildGroup = screen.getByRole("group", { name: "Build management" });
    expect(within(buildGroup).queryByRole("status")).toBeNull();

    const firstToast = screen.getByRole("status");
    const firstFeedbackKey = firstToast.getAttribute("data-feedback-key");
    expect(firstToast.textContent).toBe("Saved Crit starter");
    expect(firstToast.getAttribute("aria-live")).toBe("polite");
    expect(firstToast.classList.contains("saved-build-toast")).toBe(true);
    expect(firstFeedbackKey).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Save build" }));

    const secondToast = screen.getByRole("status");
    expect(secondToast.textContent).toBe("Saved Crit starter");
    expect(secondToast.getAttribute("data-feedback-key")).not.toBe(firstFeedbackKey);

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(screen.getByRole("status").textContent).toBe("Saved Crit starter");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("updates, deletes, and persists saved builds across remounts", () => {
    stubTreeFetch();

    const { unmount } = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    fireEvent.click(screen.getByRole("button", { name: "Allocate path" }));
    saveCurrentBuildAs("First pass");

    unmount();
    render(<App />);

    selectSavedBuild("First pass");
    expect(screen.getByText("Allocated 2/123")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Jewel Socket" }));
    fireEvent.click(screen.getByRole("button", { name: "Allocate path" }));
    fireEvent.change(screen.getByLabelText("Build name"), { target: { value: "Updated pass" } });
    fireEvent.click(screen.getByRole("button", { name: "Save build" }));

    fireEvent.click(screen.getByRole("button", { name: "New build" }));
    selectSavedBuild("Updated pass");

    expect(screen.getByText("Allocated 3/123")).not.toBeNull();
    expect(screen.queryByText("First pass")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Delete build" }));

    expect(screen.getByRole("status").textContent).toBe("Deleted Updated pass");
    expect(screen.queryByText("Updated pass")).toBeNull();
    expect((screen.getByLabelText("Build name") as HTMLInputElement).value).toBe("");
    expect(screen.getByText("Allocated 0/123")).not.toBeNull();
  });

  it("shows PoE2 class aliases and saves the selected class label separately from the root node", async () => {
    stubTreeFetchWithGraph(poe2ClassStartFixtureGraph());

    render(<App />);

    const pathStartSelect = screen.getByLabelText("Path start") as HTMLSelectElement;

    await waitFor(() => {
      expect(Array.from(pathStartSelect.options).map((option) => option.textContent)).toEqual([
        "Witch",
        "Ranger",
        "Warrior",
        "Sorceress",
        "Huntress",
        "Mercenary",
        "Monk",
        "Druid",
      ]);
    });

    fireEvent.change(pathStartSelect, { target: { value: "sorceress" } });

    expect(pathStartSelect.selectedOptions[0]?.textContent).toBe("Sorceress");
    expect(screen.getByRole("button", { name: "WITCH" }).classList.contains("path-start")).toBe(true);

    saveCurrentBuildAs("Sorceress alias");
    fireEvent.change(pathStartSelect, { target: { value: "ranger" } });
    expect(pathStartSelect.selectedOptions[0]?.textContent).toBe("Ranger");

    selectSavedBuild("Sorceress alias");

    expect(pathStartSelect.selectedOptions[0]?.textContent).toBe("Sorceress");
    expect(screen.getByRole("button", { name: "WITCH" }).classList.contains("path-start")).toBe(true);
  });

  it("selects ascendancy nodes only for the active combined class option and caps them at eight", async () => {
    stubTreeFetchWithGraph(poe2AscendancyFixtureGraph());

    render(<App />);

    const pathStartSelect = screen.getByLabelText("Path start") as HTMLSelectElement;

    await waitFor(() => {
      expect(Array.from(pathStartSelect.options).map((option) => option.textContent)).toContain("Mercenary - Gemling Legionnaire");
    });

    fireEvent.change(pathStartSelect, { target: { value: "mercenary:Mercenary3" } });

    expect(pathStartSelect.selectedOptions[0]?.textContent).toBe("Mercenary - Gemling Legionnaire");
    expect(screen.getByRole("button", { name: "DUELIST" }).classList.contains("path-start")).toBe(true);
    expect(screen.getByRole("button", { name: "Gemling Passive 1" }).classList.contains("active-ascendancy")).toBe(true);
    expect(screen.getByRole("button", { name: "Witchhunter Passive" }).classList.contains("inactive-ascendancy")).toBe(true);
    expect(screen.getByText("Ascendancy 0/8")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Gemling Passive 1" }));

    expect(screen.getByRole("button", { name: "Gemling Passive 1" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByText("Ascendancy 1/8")).not.toBeNull();
    expect(within(screen.getByRole("complementary", { name: "Build summary" })).getByText("1% increased Gemling Power")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Witchhunter Passive" }));

    expect(screen.getByRole("button", { name: "Witchhunter Passive" }).classList.contains("allocated")).toBe(false);
    expect(screen.getByText("Ascendancy 1/8")).not.toBeNull();

    for (let index = 2; index <= 9; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: `Gemling Passive ${index}` }));
    }

    expect(screen.getByText("Ascendancy 8/8")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Gemling Passive 9" }).classList.contains("allocated")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Gemling Passive 1" }));

    expect(screen.getByText("Ascendancy 1/8")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Gemling Passive 1" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByRole("button", { name: "Gemling Passive 2" }).classList.contains("allocated")).toBe(false);
  });

  it("allocates and prunes connected paths inside the selected ascendancy tree", async () => {
    stubTreeFetchWithGraph(poe2AscendancyFixtureGraph());

    render(<App />);

    const pathStartSelect = screen.getByLabelText("Path start") as HTMLSelectElement;
    await waitFor(() => {
      expect(Array.from(pathStartSelect.options).map((option) => option.textContent)).toContain("Mercenary - Gemling Legionnaire");
    });
    fireEvent.change(pathStartSelect, { target: { value: "mercenary:Mercenary3" } });

    fireEvent.click(screen.getByRole("button", { name: "Gemling Passive 3" }));

    expect(screen.getByText("Ascendancy 3/8")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Gemling Passive 1" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByRole("button", { name: "Gemling Passive 2" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByRole("button", { name: "Gemling Passive 3" }).classList.contains("allocated")).toBe(true);
    expect(document.querySelectorAll(".tree-edge.allocated")).toHaveLength(3);
    expect(document.querySelectorAll(".allocated-highlight-layer .allocated-edge")).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: "Gemling Passive 2" }));

    expect(screen.getByText("Ascendancy 2/8")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Gemling Passive 2" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByRole("button", { name: "Gemling Passive 3" }).classList.contains("allocated")).toBe(false);
    expect(document.querySelectorAll(".tree-edge.allocated")).toHaveLength(2);
  });

  it("counts ascendancy choice nodes as part of their parent point", async () => {
    stubTreeFetchWithGraph(poe2AscendancyFixtureGraph());

    render(<App />);

    const pathStartSelect = screen.getByLabelText("Path start") as HTMLSelectElement;
    await waitFor(() => {
      expect(Array.from(pathStartSelect.options).map((option) => option.textContent)).toContain("Mercenary - Gemling Legionnaire");
    });
    fireEvent.change(pathStartSelect, { target: { value: "mercenary:Mercenary3" } });

    fireEvent.click(screen.getByRole("button", { name: "Neurological Implants" }));

    expect(screen.getByText("Ascendancy 2/8")).not.toBeNull();
    expect(within(screen.getByRole("complementary", { name: "Build summary" })).getByText("2 allocated points")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Gemling Passive 1" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByRole("button", { name: "Implanted Gems" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByRole("button", { name: "Neurological Implants" }).classList.contains("allocated")).toBe(true);
    expect(document.querySelectorAll(".tree-edge.allocated")).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: "Motoric Implants" }));

    expect(screen.getByText("Ascendancy 2/8")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Neurological Implants" }).classList.contains("allocated")).toBe(false);
    expect(screen.getByRole("button", { name: "Motoric Implants" }).classList.contains("allocated")).toBe(true);
    expect(document.querySelectorAll(".tree-edge.allocated")).toHaveLength(3);
  });

  it("hides ascendancy-gated tree passives until their unlock node is allocated", async () => {
    stubTreeFetchWithGraph(poe2OracleGatedFixtureGraph());

    render(<App />);

    const pathStartSelect = screen.getByLabelText("Path start") as HTMLSelectElement;
    await waitFor(() => {
      expect(Array.from(pathStartSelect.options).map((option) => option.textContent)).toContain("Druid - Oracle");
    });

    expect(screen.queryByRole("button", { name: "Comradery" })).toBeNull();

    changePassiveSearch("Comradery");
    expect(await screen.findByText("0 matches")).not.toBeNull();

    fireEvent.change(pathStartSelect, { target: { value: "druid:Druid1" } });
    expect(screen.queryByRole("button", { name: "Comradery" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "The Unseen Path" }));

    expect(await screen.findByRole("button", { name: "Comradery" })).not.toBeNull();
    expect(await screen.findByText("1 match")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Comradery 30% increased Damage" })).not.toBeNull();
  });

  it("searches passive names and stats and highlights matching nodes", async () => {
    stubTreeFetch();

    render(<App />);

    changePassiveSearch("critical");

    expect(await screen.findByText("1 match")).not.toBeNull();
    expect(document.querySelectorAll(".search-highlight-layer .search-match-marker")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Precise Shot 25% increased Critical Hit Chance" })).not.toBeNull();
    expect(screen.getByText("Notable · 2 points from allocation")).not.toBeNull();
    expect(screen.queryByText("Notable · precise_shot")).toBeNull();
  });

  it("focuses the map highlight when hovering a passive search result", async () => {
    stubTreeFetch();

    render(<App />);

    changePassiveSearch("critical");

    const result = await screen.findByRole("button", { name: "Precise Shot 25% increased Critical Hit Chance" });
    const mapNode = screen.getByRole("button", { name: "Precise Shot" });

    fireEvent.mouseEnter(result);

    expect(mapNode.classList.contains("search-focus")).toBe(false);
    expect(document.querySelectorAll(".search-focus-highlight-layer .search-focus-marker")).toHaveLength(1);

    fireEvent.mouseLeave(result);

    expect(mapNode.classList.contains("search-focus")).toBe(false);
    expect(document.querySelectorAll(".search-focus-highlight-layer .search-focus-marker")).toHaveLength(0);
  });

  it("keeps the map highlight focused when selecting a passive search result", async () => {
    stubTreeFetch();

    render(<App />);

    changePassiveSearch("critical");

    const result = await screen.findByRole("button", { name: "Precise Shot 25% increased Critical Hit Chance" });
    const mapNode = screen.getByRole("button", { name: "Precise Shot" });

    fireEvent.click(result);

    expect(mapNode.classList.contains("search-focus")).toBe(false);
    expect(document.querySelectorAll(".search-focus-highlight-layer .search-focus-marker")).toHaveLength(1);
  });

  it("shows allocated status for passive search results that are already allocated", async () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    fireEvent.click(screen.getByRole("button", { name: "Allocate path" }));
    changePassiveSearch("critical");

    expect(await screen.findByText("Notable · Allocated")).not.toBeNull();
  });

  it("calculates passive search distance from the closest node in the current planned path", async () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    changePassiveSearch("critical");

    expect(await screen.findByText("Notable · 0 points from allocation")).not.toBeNull();
    expect(screen.queryByText("Notable · Allocated")).toBeNull();

    changePassiveSearch("empty jewel slots");

    expect(await screen.findByText("Jewel socket · 1 point from allocation")).not.toBeNull();
    expect(screen.queryByText("Jewel socket · 3 points from allocation")).toBeNull();
  });

  it("sorts passive search results by closest allocation distance", async () => {
    stubTreeFetchWithGraph(searchSortFixtureGraph());

    render(<App />);

    await screen.findByRole("button", { name: "Close Critical" });

    changePassiveSearch("critical");

    await screen.findByText("Small · 1 point from allocation");
    const resultNames = Array.from(document.querySelectorAll(".search-result-name"))
      .map((element) => element.textContent);

    expect(resultNames.slice(0, 2)).toEqual(["Close Critical", "Precise Shot"]);
    expect(screen.getByText("Small · 1 point from allocation")).not.toBeNull();
    expect(screen.getByText("Notable · 2 points from allocation")).not.toBeNull();
  });

  it("matches jewel sockets when searching for empty jewel slots", async () => {
    stubTreeFetch();

    render(<App />);

    changePassiveSearch("empty jewel slots");

    expect(await screen.findByText("1 match")).not.toBeNull();
    expect(document.querySelectorAll(".search-highlight-layer .search-match-marker")).toHaveLength(1);
  });

  it("adds all current search results with the same matched stat as build goals", async () => {
    stubTreeFetchWithGraph(repeatedMinionFixtureGraph());

    render(<App />);

    await screen.findByRole("button", { name: "Minion Damage One" });
    changePassiveSearch("15% minion damage");

    const addAllMatching = await screen.findAllByRole("button", {
      name: "Add all 3 nodes matching 15% increased Minion Damage to build goals",
    });
    fireEvent.click(addAllMatching[0]);

    const buildGoals = screen.getByRole("region", { name: "Build goals" });
    expect(within(buildGoals).getByText("Minion Damage One")).not.toBeNull();
    expect(within(buildGoals).getByText("Minion Damage Two")).not.toBeNull();
    expect(within(buildGoals).getByText("Minion Damage Three")).not.toBeNull();
    expect(within(buildGoals).queryByText("Minion Commander")).toBeNull();
    expect(screen.getByRole("button", { name: "Minion Damage One" }).classList.contains("build-goal")).toBe(true);
    expect(screen.getByRole("button", { name: "Minion Damage Two" }).classList.contains("build-goal")).toBe(true);
    expect(screen.getByRole("button", { name: "Minion Damage Three" }).classList.contains("build-goal")).toBe(true);
  });

  it("adds, removes, and clears build goals from the node inspector", () => {
    stubTreeFetch();

    render(<App />);

    const goalsPanel = screen.getByRole("region", { name: "Build goals" });

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    fireEvent.click(screen.getByRole("button", { name: "Add build goal" }));

    expect(within(goalsPanel).getByText("Precise Shot")).not.toBeNull();
    expect(within(goalsPanel).getByText("Notable · Reached")).not.toBeNull();

    fireEvent.click(within(goalsPanel).getByRole("button", { name: "Remove Precise Shot build goal" }));

    expect(within(goalsPanel).queryByText("Precise Shot")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    fireEvent.click(screen.getByRole("button", { name: "Add build goal" }));
    fireEvent.click(screen.getByRole("button", { name: "Jewel Socket" }));
    fireEvent.click(screen.getByRole("button", { name: "Add build goal" }));
    fireEvent.click(within(goalsPanel).getByRole("button", { name: "Clear goals" }));

    expect(within(goalsPanel).getByText("No build goals selected.")).not.toBeNull();
  });

  it("adds build goals from passive search results without duplicating them", async () => {
    stubTreeFetch();

    render(<App />);

    changePassiveSearch("critical");
    fireEvent.click(await screen.findByRole("button", { name: "Add Precise Shot to build goals" }));

    const goalsPanel = screen.getByRole("region", { name: "Build goals" });
    expect(within(goalsPanel).getAllByText("Precise Shot")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    expect((screen.getByRole("button", { name: "Build goal added" }) as HTMLButtonElement).disabled).toBe(true);
    expect(within(goalsPanel).getAllByText("Precise Shot")).toHaveLength(1);

    const searchResult = screen.getByRole("button", { name: "Precise Shot 25% increased Critical Hit Chance" });
    expect(searchResult.querySelector("button")).toBeNull();
  });

  it("marks build goal nodes on the tree", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    fireEvent.click(screen.getByRole("button", { name: "Add build goal" }));

    const node = screen.getByRole("button", { name: "Precise Shot" });
    expect(node.classList.contains("build-goal")).toBe(true);
    expect(node.querySelector(".build-goal-marker")).not.toBeNull();
  });

  it("imports eligible build goals from a pasted PoB build code", async () => {
    stubTreeFetchWithGraph(pobImportFixtureGraph());
    const code = encodePobXml(`
      <PathOfBuilding2>
        <Tree activeSpec="1">
          <Spec title="Imported Tree" nodes="100,101,102,103,999" />
        </Tree>
      </PathOfBuilding2>
    `);

    render(<App />);

    await screen.findByRole("button", { name: "Required Notable" });

    fireEvent.change(screen.getByLabelText("PoB build code"), { target: { value: code } });
    fireEvent.click(screen.getByRole("button", { name: "Import PoB goals" }));

    expect(await screen.findByText("Imported 2 build goals.")).not.toBeNull();
    expect(screen.getByText("PoB base passives: 3.")).not.toBeNull();
    const goalsPanel = screen.getByRole("region", { name: "Build goals" });
    expect(within(goalsPanel).getByText("Required Notable")).not.toBeNull();
    expect(within(goalsPanel).getByText("Imported Jewel")).not.toBeNull();
    expect(within(goalsPanel).queryByText("Pathing")).toBeNull();
    expect(within(goalsPanel).queryByText("Unused Keystone")).toBeNull();
  });

  it("imports and selects PoB ascendancy passives with a concise import summary", async () => {
    stubTreeFetchWithGraph(pobAscendancyImportFixtureGraph());
    const code = encodePobXml(`
      <PathOfBuilding2>
        <Build className="Mercenary" ascendClassName="Gemling Legionnaire" />
        <Tree activeSpec="1">
          <Spec title="Gemling Tree" nodes="1000,2000,2001,2002,2003,2010,2011" />
        </Tree>
      </PathOfBuilding2>
    `);

    render(<App />);

    const pathStartSelect = screen.getByLabelText("Path start") as HTMLSelectElement;
    await waitFor(() => {
      expect(Array.from(pathStartSelect.options).map((option) => option.textContent)).toContain("Mercenary - Gemling Legionnaire");
    });

    fireEvent.change(screen.getByLabelText("PoB build code"), { target: { value: code } });
    fireEvent.click(screen.getByRole("button", { name: "Import PoB goals" }));

    expect(await screen.findByText("Imported 0 build goals.")).not.toBeNull();
    expect(screen.getByText("PoB base passives: 0.")).not.toBeNull();
    expect(screen.getByText("Selected 5 ascendancy passives.")).not.toBeNull();
    expect(screen.queryByText(/weapon set/i)).toBeNull();
    expect(screen.queryByText(/Non-weapon nodes imported/i)).toBeNull();
    expect(pathStartSelect.selectedOptions[0]?.textContent).toBe("Mercenary - Gemling Legionnaire");
    expect(screen.getByText("Ascendancy 4/8")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Gemling Passive 1" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByRole("button", { name: "Gemling Passive 3" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByRole("button", { name: "Implanted Gems" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByRole("button", { name: "Neurological Implants" }).classList.contains("allocated")).toBe(true);
  });

  it("sets Path start from explicit PoB class metadata when importing goals", async () => {
    stubTreeFetchWithGraph(pobClassStartImportFixtureGraph());
    const code = encodePobXml(`
      <PathOfBuilding2>
        <Build className="Huntress" />
        <Tree activeSpec="1">
          <Spec title="Huntress Tree" nodes="200,201" />
        </Tree>
      </PathOfBuilding2>
    `);

    render(<App />);

    const pathStartSelect = screen.getByLabelText("Path start") as HTMLSelectElement;
    await waitFor(() => {
      expect(Array.from(pathStartSelect.options).map((option) => option.textContent)).toContain("Huntress");
    });

    expect(pathStartSelect.selectedOptions[0]?.textContent).toBe("Witch");

    fireEvent.change(screen.getByLabelText("PoB build code"), { target: { value: code } });
    fireEvent.click(screen.getByRole("button", { name: "Import PoB goals" }));

    expect(await screen.findByText(/Path start set to Huntress from PoB/i)).not.toBeNull();
    expect(pathStartSelect.selectedOptions[0]?.textContent).toBe("Huntress");
    expect(screen.getByRole("button", { name: "RANGER" }).classList.contains("path-start")).toBe(true);
    expect(screen.getByRole("button", { name: "Required Huntress Notable" }).classList.contains("build-goal")).toBe(true);
  });

  it("optimizes build goals into a preview without applying the route", async () => {
    stubTreeFetch();

    render(<App />);

    changePassiveSearch("critical");
    fireEvent.click(await screen.findByRole("button", { name: "Add Precise Shot to build goals" }));
    changePassiveSearch("empty jewel slots");
    fireEvent.click(await screen.findByRole("button", { name: "Add Jewel Socket to build goals" }));
    fireEvent.click(screen.getByRole("button", { name: "Optimize route" }));

    expect(await screen.findByText("Optimized route: 3 points")).not.toBeNull();
    expect(screen.getByText("Allocated 0/123")).not.toBeNull();
    expect(document.querySelectorAll(".tree-edge.allocation-path")).toHaveLength(3);
    expect((screen.getByRole("button", { name: "Apply optimized route" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("applies an optimized route to committed allocation", async () => {
    stubTreeFetch();

    render(<App />);

    changePassiveSearch("critical");
    fireEvent.click(await screen.findByRole("button", { name: "Add Precise Shot to build goals" }));
    changePassiveSearch("empty jewel slots");
    fireEvent.click(await screen.findByRole("button", { name: "Add Jewel Socket to build goals" }));
    fireEvent.click(screen.getByRole("button", { name: "Optimize route" }));

    await screen.findByText("Optimized route: 3 points");
    fireEvent.click(screen.getByRole("button", { name: "Apply optimized route" }));

    expect(screen.getByText("Allocated 3/123")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Precise Shot" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("allocated")).toBe(true);
    expect(document.querySelectorAll(".tree-edge.allocated")).toHaveLength(3);
  });

  it("uses the current pending path as the optimizer base", async () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    changePassiveSearch("empty jewel slots");
    fireEvent.click(await screen.findByRole("button", { name: "Add Jewel Socket to build goals" }));
    fireEvent.click(screen.getByRole("button", { name: "Optimize route" }));

    expect(await screen.findByText("Optimized route: 1 point")).not.toBeNull();
    expect(document.querySelectorAll(".tree-edge.allocation-path")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Projectile Damage" }).classList.contains("allocation-path")).toBe(false);
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("allocation-path")).toBe(true);
  });

  it("applies a branching optimized route with deterministic prune order", async () => {
    stubTreeFetchWithGraph(endpointFixtureGraph());

    render(<App />);

    await screen.findByRole("button", { name: "Near Start Branch" });

    changePassiveSearch("empty jewel slots");
    fireEvent.click(await screen.findByRole("button", { name: "Add Jewel Socket to build goals" }));
    changePassiveSearch("branch");
    fireEvent.click(await screen.findByRole("button", { name: "Add Near Start Branch to build goals" }));
    fireEvent.click(screen.getByRole("button", { name: "Optimize route" }));

    await screen.findByText("Optimized route: 4 points");
    fireEvent.click(screen.getByRole("button", { name: "Apply optimized route" }));

    expect(screen.getByText("Allocated 4/123")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Near Start Branch" }));

    await waitFor(() => {
      expect(screen.getByText("Allocated 1/123")).not.toBeNull();
    });
    expect(screen.getByRole("button", { name: "Near Start Branch" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("allocated")).toBe(false);
  });

  it("previews the allocation path from the selected class start to the selected target", () => {
    stubTreeFetch();

    render(<App />);

    expect((screen.getByLabelText("Path start") as HTMLSelectElement).value).toBe("Mercenary");
    expect(screen.getByRole("button", { name: "Mercenary" }).classList.contains("path-start")).toBe(true);
    expect(screen.getByRole("button", { name: "Mercenary" }).querySelector(".path-start-marker")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));

    expect(screen.getByText("Allocation path")).not.toBeNull();
    expect(screen.getByText("2 points")).not.toBeNull();
    expect(screen.getByText("Mercenary -> Projectile Damage -> Precise Shot")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Projectile Damage" }).classList.contains("allocation-path")).toBe(true);
    expect(document.querySelectorAll(".tree-edge.allocation-path")).toHaveLength(2);
  });

  it("previews a hover path from the closest allocated node without selecting the target", () => {
    stubTreeFetch();

    render(<App />);
    enableHoverPathPreview();

    const target = screen.getByRole("button", { name: "Precise Shot" });

    fireEvent.mouseEnter(target, { clientX: 220, clientY: 140 });

    expect(screen.getByText("No node selected.")).not.toBeNull();
    expect(target.classList.contains("selected")).toBe(false);
    expect(screen.getByRole("button", { name: "Mercenary" }).classList.contains("hover-allocation-path")).toBe(false);
    expect(screen.getByRole("button", { name: "Projectile Damage" }).classList.contains("hover-allocation-path")).toBe(true);
    expect(target.classList.contains("hover-allocation-path")).toBe(true);
    expect(document.querySelectorAll(".tree-edge.hover-allocation-path")).toHaveLength(2);
    expect(document.querySelectorAll(".hover-path-highlight-layer .hover-allocation-path-edge")).toHaveLength(2);

    fireEvent.mouseLeave(target);

    expect(screen.getByRole("button", { name: "Projectile Damage" }).classList.contains("hover-allocation-path")).toBe(false);
    expect(document.querySelectorAll(".tree-edge.hover-allocation-path")).toHaveLength(0);
    expect(document.querySelectorAll(".hover-path-highlight-layer .hover-allocation-path-edge")).toHaveLength(0);
  });

  it("keeps hover allocation previews off until the header toggle is enabled", () => {
    stubTreeFetch();

    render(<App />);

    const target = screen.getByRole("button", { name: "Precise Shot" });

    fireEvent.mouseEnter(target, { clientX: 220, clientY: 140 });

    expect(target.classList.contains("hover-allocation-path")).toBe(false);
    expect(document.querySelectorAll(".tree-edge.hover-allocation-path")).toHaveLength(0);

    fireEvent.click(screen.getByLabelText("Hover path preview"));
    fireEvent.mouseEnter(target, { clientX: 220, clientY: 140 });

    expect(target.classList.contains("hover-allocation-path")).toBe(true);
    expect(document.querySelectorAll(".tree-edge.hover-allocation-path")).toHaveLength(2);

    fireEvent.click(screen.getByLabelText("Hover path preview"));

    expect(target.classList.contains("hover-allocation-path")).toBe(false);
    expect(document.querySelectorAll(".tree-edge.hover-allocation-path")).toHaveLength(0);
  });

  it("does not preview hover paths while Ctrl is held for goal adding", () => {
    stubTreeFetch();

    render(<App />);
    enableHoverPathPreview();

    fireEvent.keyDown(window, { key: "Control", ctrlKey: true });
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Precise Shot" }), {
      clientX: 220,
      clientY: 140,
      ctrlKey: true,
    });

    expect(screen.getByRole("button", { name: "Projectile Damage" }).classList.contains("hover-allocation-path")).toBe(false);
    expect(screen.getByRole("button", { name: "Precise Shot" }).classList.contains("hover-allocation-path")).toBe(false);
    expect(document.querySelectorAll(".tree-edge.hover-allocation-path")).toHaveLength(0);

    fireEvent.keyUp(window, { key: "Control" });
  });

  it("clears an existing hover path when Ctrl is pressed", () => {
    stubTreeFetch();

    render(<App />);
    enableHoverPathPreview();

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Precise Shot" }), { clientX: 220, clientY: 140 });

    expect(document.querySelectorAll(".tree-edge.hover-allocation-path")).toHaveLength(2);

    fireEvent.keyDown(window, { key: "Control", ctrlKey: true });

    expect(screen.getByRole("button", { name: "Projectile Damage" }).classList.contains("hover-allocation-path")).toBe(false);
    expect(screen.getByRole("button", { name: "Precise Shot" }).classList.contains("hover-allocation-path")).toBe(false);
    expect(document.querySelectorAll(".tree-edge.hover-allocation-path")).toHaveLength(0);

    fireEvent.keyUp(window, { key: "Control" });
  });

  it("previews hover paths from the nearest committed allocation", async () => {
    stubTreeFetchWithGraph(endpointFixtureGraph());

    render(<App />);
    enableHoverPathPreview();

    await screen.findByRole("button", { name: "Near Start Branch" });

    fireEvent.click(screen.getByRole("button", { name: "Jewel Socket" }));
    fireEvent.click(screen.getByRole("button", { name: "Allocate path" }));
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Near Start Branch" }), { clientX: 20, clientY: 140 });

    expect(screen.getByRole("button", { name: "Mercenary" }).classList.contains("hover-allocation-path")).toBe(false);
    expect(screen.getByRole("button", { name: "Near Start Branch" }).classList.contains("hover-allocation-path")).toBe(true);
    expect(screen.getByRole("button", { name: "Projectile Damage" }).classList.contains("hover-allocation-path")).toBe(false);
    expect(document.querySelectorAll(".tree-edge.hover-allocation-path")).toHaveLength(1);
  });

  it("previews only the unallocated hover extension from a pending path", () => {
    stubTreeFetch();

    render(<App />);
    enableHoverPathPreview();

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Jewel Socket" }), { clientX: 320, clientY: 180 });

    expect(screen.getByRole("button", { name: "Mercenary" }).classList.contains("hover-allocation-path")).toBe(false);
    expect(screen.getByRole("button", { name: "Projectile Damage" }).classList.contains("hover-allocation-path")).toBe(false);
    expect(screen.getByRole("button", { name: "Precise Shot" }).classList.contains("hover-allocation-path")).toBe(false);
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("hover-allocation-path")).toBe(true);
    expect(document.querySelectorAll(".tree-edge.hover-allocation-path")).toHaveLength(1);
    expect(document.querySelectorAll(".tree-edge.allocation-path.hover-allocation-path")).toHaveLength(0);
  });

  it("commits previewed allocation paths and previews new paths from allocated nodes", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));
    fireEvent.click(screen.getByRole("button", { name: "Allocate path" }));

    expect(screen.getByText("Allocated 2/123")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Precise Shot" }).classList.contains("allocated")).toBe(true);
    expect(document.querySelectorAll(".tree-edge.allocated")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Jewel Socket" }));

    expect(screen.getByText("1 point")).not.toBeNull();
    expect(screen.getByText("Precise Shot -> Jewel Socket")).not.toBeNull();
    expect(document.querySelectorAll(".tree-edge.allocation-path")).toHaveLength(1);
  });

  it("previews new paths from the closest allocated node", async () => {
    stubTreeFetchWithGraph(endpointFixtureGraph());

    render(<App />);

    await screen.findByRole("button", { name: "Near Start Branch" });

    fireEvent.click(screen.getByRole("button", { name: "Jewel Socket" }));
    fireEvent.click(screen.getByRole("button", { name: "Allocate path" }));
    fireEvent.click(screen.getByRole("button", { name: "Near Start Branch" }));

    expect(screen.getByText("1 point")).not.toBeNull();
    expect(screen.getByText("Mercenary -> Near Start Branch")).not.toBeNull();
    expect(document.querySelectorAll(".tree-edge.allocation-path")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Allocate path" }));

    expect(screen.getByText("Allocated 4/123")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByRole("button", { name: "Near Start Branch" }).classList.contains("allocated")).toBe(true);
    expect(document.querySelectorAll(".tree-edge.allocated")).toHaveLength(4);
  });

  it("branches uncommitted preview paths from the closest pending node", async () => {
    stubTreeFetchWithGraph(endpointFixtureGraph());

    render(<App />);

    await screen.findByRole("button", { name: "Near Start Branch" });

    fireEvent.click(screen.getByRole("button", { name: "Jewel Socket" }));

    expect(screen.getByText("3 points")).not.toBeNull();
    expect(screen.getByText("Mercenary -> Projectile Damage -> Precise Shot -> Jewel Socket")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Near Start Branch" }));

    expect(screen.getByText("Allocated 0/123")).not.toBeNull();
    expect(screen.getByText("1 point")).not.toBeNull();
    expect(screen.getByText("Mercenary -> Near Start Branch")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("allocation-path")).toBe(true);
    expect(screen.getByRole("button", { name: "Near Start Branch" }).classList.contains("allocation-path")).toBe(true);
    expect(document.querySelectorAll(".tree-edge.allocation-path")).toHaveLength(4);
  });

  it("clicking an allocated node prunes later allocated nodes", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Jewel Socket" }));
    fireEvent.click(screen.getByRole("button", { name: "Allocate path" }));

    expect(screen.getByText("Allocated 3/123")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("allocated")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Precise Shot" }));

    expect(screen.getByText("Allocated 2/123")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Precise Shot" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("allocated")).toBe(false);
    expect(document.querySelectorAll(".tree-edge.allocated")).toHaveLength(2);
  });

  it("clicking the last allocated node removes that node", () => {
    stubTreeFetch();

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Jewel Socket" }));
    fireEvent.click(screen.getByRole("button", { name: "Allocate path" }));

    expect(screen.getByText("Allocated 3/123")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("allocated")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Jewel Socket" }));

    expect(screen.getByText("Allocated 2/123")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Precise Shot" }).classList.contains("allocated")).toBe(true);
    expect(screen.getByRole("button", { name: "Jewel Socket" }).classList.contains("allocated")).toBe(false);
    expect(document.querySelectorAll(".tree-edge.allocated")).toHaveLength(2);
  });
});

function expectTooltipText(element: HTMLElement, expectedText: string) {
  const tooltipId = element.getAttribute("aria-describedby");
  expect(tooltipId).toBeTruthy();
  expect(document.getElementById(tooltipId ?? "")?.textContent).toContain(expectedText);
}

function encodePobXml(xml: string): string {
  return deflateSync(xml).toString("base64").replaceAll("+", "-").replaceAll("/", "_");
}
