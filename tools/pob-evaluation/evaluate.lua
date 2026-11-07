dofile(assert(os.getenv("POB_EVALUATION_TOOLS")) .. "/bootstrap.lua")
local json = require("dkjson")
local witchIntegerId
for _, class in pairs(build.spec.tree.classes) do
  if class.name == "Witch" then witchIntegerId = class.integerId end
end
assert(witchIntegerId, "The copied tree has no Witch class")

local function loadFixture(mods)
  local xmlText = assert(common.xml.ComposeXML({
    elem = "PathOfBuilding2",
    { elem = "Build", attrib = { level = "90", className = "Witch", ascendClassName = "None", targetVersion = liveTargetVersion } },
    { elem = "Tree", attrib = { activeSpec = "1" }, {
      elem = "Spec", attrib = { treeVersion = "0_5", nodes = "", classInternalId = tostring(witchIntegerId), ascendancyInternalId = "" },
    } },
    { elem = "Config", { elem = "Input", attrib = { name = "customMods", string = mods or "" } } },
  }))
  loadBuildFromXML(xmlText, "Isolated calculation fixture")
  assert(not launch.promptMsg, launch.promptMsg)
  assert(build.spec.curClassName == "Witch", "The fixture class was not loaded")
  assert(build.configTab.input.customMods == (mods or ""), "The fixture modifiers were not loaded")
  return build.calcsTab.calcs.getMiscCalculator(build)
end

local function snapshot(output)
  local selected = { }
  for _, name in ipairs({ "Str", "Dex", "Int", "Life", "Mana", "EnergyShield", "EnergyShieldInc", "CombinedDPS", "TotalDPS", "Speed", "AverageHit", "HitChance" }) do
    selected[name] = output[name]
  end
  selected.damage = { }
  for name, value in pairs(output.MainHand or output) do
    if type(value) == "number" and (name:match("Lightning") or name:match("Physical") or name:match("Damage") or name:match("Hit")) then
      selected.damage[name] = value
    end
  end
  return selected
end

local cases = {
  { id = "baseline", mods = "" },
  { id = "strength", mods = "+10 to Strength" },
  { id = "intelligence", mods = "+10 to Intelligence" },
  { id = "flat-es", mods = "+100 to maximum Energy Shield" },
  { id = "increased-es", mods = "+100 to maximum Energy Shield\n20% increased maximum Energy Shield" },
  { id = "additive-es", mods = "+100 to maximum Energy Shield\n20% increased maximum Energy Shield\n30% increased maximum Energy Shield" },
  { id = "more-es", mods = "+100 to maximum Energy Shield\n20% increased maximum Energy Shield\n30% more maximum Energy Shield" },
  { id = "flat-and-increased-es", mods = "+100 to maximum Energy Shield\n+100 to maximum Energy Shield\n20% increased maximum Energy Shield" },
  { id = "attack-speed", mods = "50% increased Attack Speed\n50% increased Attack Speed" },
  { id = "more-attack-damage", mods = "20% more Attack Damage" },
  { id = "damage-ranges", mods = "Adds 1 to 7 Lightning damage to Attacks\nAdds 1 to 7 Lightning damage to Attacks\nAdds 1 to 37 Lightning damage to Attacks" },
}
local output = { version = launch.versionNumber, cases = { } }
for _, fixture in ipairs(cases) do
  local _, calculated = loadFixture(fixture.mods)
  table.insert(output.cases, { id = fixture.id, customMods = fixture.mods, output = snapshot(calculated) })
end

local routeFile = assert(io.open("../route-fixtures.json", "r"))
local routes = assert(json.decode(routeFile:read("*a")))
routeFile:close()
loadFixture("+100 to maximum Energy Shield")
assert(build.spec.allocNodes[tonumber(routes.baseNodeId)], "The app and PoB disagree on the Witch start")
for _, candidate in ipairs(routes.candidates) do
  for _, node in ipairs(candidate.nodes) do
    assert(build.spec.nodes[tonumber(node.id)], "Candidate passive missing from PoB: " .. node.id)
    for _, stat in ipairs(node.stats) do
      if stat == "+5 to any Attribute" then build.spec:SwitchAttributeNode(tonumber(node.id), 1) end
    end
  end
end
build.spec:BuildAllDependsAndPaths()
local calculator, base = build.calcsTab.calcs.getMiscCalculator(build)
output.routeBaseline = snapshot(base)
output.routes = { }
local allocatedBefore = { }
for id in pairs(build.spec.allocNodes) do table.insert(allocatedBefore, id) end
table.sort(allocatedBefore)
local selectedBefore = table.concat(allocatedBefore, ",")
for _, candidate in ipairs(routes.candidates) do
  local nodes = { }
  for _, id in ipairs(candidate.nodeIds) do
    local node = assert(build.spec.nodes[tonumber(id)], "Candidate passive missing from PoB: " .. id)
    if not node.alloc then nodes[node] = true end
  end
  local started = os.clock()
  local calculated = calculator({ addNodes = nodes }, true)
  local durationMs = (os.clock() - started) * 1000
  table.insert(output.routes, { label = candidate.label, pointCost = candidate.pointCost, output = snapshot(calculated), durationMs = durationMs })
end
local allocatedAfter = { }
for id in pairs(build.spec.allocNodes) do table.insert(allocatedAfter, id) end
table.sort(allocatedAfter)
output.allocationUnchanged = selectedBefore == table.concat(allocatedAfter, ",")
output.routeBaselineAfter = snapshot(calculator({}, true))
assert(output.allocationUnchanged, "Candidate calculation changed the original allocation")

local file = assert(io.open("../pob-results.json", "w"))
file:write(json.encode(output, { indent = true }))
file:close()
print("Wrote isolated calculations to ../pob-results.json")
