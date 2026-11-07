dofile(assert(os.getenv("POB_EVALUATION_TOOLS")) .. "/bootstrap.lua")
local collectEffectCoverage = dofile(assert(os.getenv("POB_EVALUATION_TOOLS")) .. "/effect_coverage.lua")
local job = assert(os.getenv("POB_EVALUATION_JOB"))
local json = require("dkjson")
local function read(path)
  local file = assert(io.open(job .. "/" .. path, "r"))
  local text = file:read("*a")
  file:close()
  return text
end
local audit = assert(json.decode(read("audit-input.json")))
local originalSourceXml = read("source-build.xml")
local originalSourceTree = assert(common.xml.ParseXML(originalSourceXml))[1]

local function equal(a, b)
  if type(a) ~= type(b) then return false end
  if type(a) ~= "table" then return a == b end
  for key, value in pairs(a) do if not equal(value, b[key]) then return false end end
  for key in pairs(b) do if a[key] == nil then return false end end
  return true
end

local function child(element, name)
  for _, node in ipairs(element) do if type(node) == "table" and node.elem == name then return node end end
end

local function listIds(text)
  local ids = { }
  for id in (text or ""):gmatch("%d+") do ids[id] = true end
  return ids
end

local function sortedIds(nodes)
  local ids = { }
  for id in pairs(nodes) do table.insert(ids, tostring(id)) end
  table.sort(ids)
  return ids
end

local function snapshot(output)
  local result = { }
  for _, stat in ipairs({ "Life", "LifeRecoverable", "Mana", "ManaUnreserved", "EnergyShield", "FullDPS", "CombinedDPS", "TotalDPS", "TotalEHP", "Str", "Dex", "Int", "Armour", "Evasion", "ReqStr", "ReqDex", "ReqInt", "sharedMindOverMatter", "sharedManaEffectiveLife", "LifeRegen", "ManaRegen", "LifeRegenRecovery", "ManaRegenRecovery", "ManaPerSecondCost", "LifePerSecondCost" }) do
    local value = output[stat]
    if type(value) == "number" and value == value and value ~= math.huge and value ~= -math.huge then result[stat] = value end
  end
  return result
end

local function weaponAssignments()
  local sets = { ["1"] = { }, ["2"] = { } }
  for id, node in pairs(build.spec.allocNodes) do
    if node.allocMode == 1 or node.allocMode == 2 then table.insert(sets[tostring(node.allocMode)], tostring(id)) end
  end
  table.sort(sets["1"]); table.sort(sets["2"])
  return sets
end

local function recoveryInputs(label)
  local calcs = build.calcsTab.calcs
  local env = calcs.initEnv(build, "CALCULATOR")
  calcs.perform(env)
  local db, output = env.player.modDB, env.player.output
  local inputs = { }
  for _, resource in ipairs({ "Life", "Mana" }) do
    inputs[resource] = {
      pool = output[resource], flat = db:Sum("BASE", nil, resource .. "Regen"), percent = db:Sum("BASE", nil, resource .. "RegenPercent"),
      increased = db:Sum("INC", nil, resource .. "Regen", resource .. "RecoveryRate"), more = db:More(nil, resource .. "Regen", resource .. "RecoveryRate"),
      disabled = not not (db:Flag(nil, "No" .. resource .. "Regen") or db:Flag(nil, "CannotGain" .. resource)),
      unaffected = not not db:Flag(nil, "UnaffectedBy" .. resource .. "Regen"),
      degenFlat = db:Sum("BASE", nil, resource .. "Degen"), degenPercent = db:Sum("BASE", nil, resource .. "DegenPercent"),
      degenIncreased = db:Sum("INC", nil, resource .. "Degen"), degenMore = db:More(nil, resource .. "Degen"),
      recoveryFlat = db:Sum("BASE", nil, resource .. "Recovery"), recoveryRate = output[resource .. "RecoveryRateMod"],
      overflow = db:Sum("BASE", nil, "Overflow" .. resource .. "Recovery"),
      transferredToES = not not (resource == "Life" and db:Flag(nil, "ZealotsOath")),
    }
  end
  return inputs, collectEffectCoverage(env, audit.sourceXmlSha256, label)
end

local function context()
  local result = {
    class = build.spec.curClassName, ascendancy = build.spec.curAscendClassName,
    level = build.characterLevel, mainSocketGroup = build.mainSocketGroup,
    sockets = copyTable(build.spec.jewels, true), ascendancyNodes = { }, weaponNodes = { },
  }
  for id, node in pairs(build.spec.allocNodes) do
    if node.ascendancyName then result.ascendancyNodes[tostring(id)] = true end
    if node.allocMode and node.allocMode ~= 0 then result.weaponNodes[tostring(id)] = node.allocMode end
  end
  for _, name in ipairs({ "Items", "Skills", "Config" }) do
    local xml = { elem = name }
    build.savers[name]:Save(xml)
    result[name] = xml
  end
  return result
end

local function attributeChoicesMatch(expected)
  for id, description in pairs(expected) do
    local node = build.spec.hashOverrides[tonumber(id)]
    if not node or table.concat(node.sd or { }, "; ") ~= description then return false end
  end
  return true
end

local function loadXml(text)
  loadBuildFromXML(text, "Public real-build audit")
  assert(not launch.promptMsg, launch.promptMsg)
  assert(build.targetVersion == liveTargetVersion, "The build needs a target-version conversion")
  assert(build.spec.treeVersion == "0_5", "The expected passive tree did not load")
  assert(build.spec.curClassName == audit.className, "The published class did not load")
  assert(build.spec.curAscendClassName == audit.ascendancyName, "The published ascendancy did not load")
end

local function evaluateScenario(sourceXml)
  local sourceTree = assert(common.xml.ParseXML(sourceXml))[1]
  loadXml(sourceXml)
  local originalAllocation = sortedIds(build.spec.allocNodes)
  local protectedContext = copyTable(context(), true)
  local sourceAttributeChoices = { }
  for _, candidate in ipairs(audit.candidates) do
    for _, id in ipairs(candidate.nodeIds) do
      assert(build.spec.nodes[tonumber(id)], "A candidate passive is missing from PoB: " .. id)
    end
  end
  for id, node in pairs(build.spec.hashOverrides) do sourceAttributeChoices[tostring(id)] = table.concat(node.sd or { }, "; ") end

  -- New travel attributes need an explicit choice; existing choices are never replaced.
  local newAttributes = { }
  for _, candidate in ipairs(audit.candidates) do
    for _, node in ipairs(candidate.nodes) do
      local id = tonumber(node.id)
      if node.attribute and not build.spec.hashOverrides[id] then
        local choice = ({ Strength = 1, Dexterity = 2, Intelligence = 3 })[audit.newAttributeChoice or "Intelligence"]
        build.spec:SwitchAttributeNode(id, assert(choice))
        newAttributes[node.id] = true
      end
    end
  end
  build.spec:BuildAllDependsAndPaths()
  local calculator, base = build.calcsTab.calcs.getMiscCalculator(build)
  local result = {
    engineVersion = launch.versionNumber, treeVersion = build.spec.treeVersion,
    sourceUrl = audit.sourceUrl, baseline = snapshot(base), candidates = { },
    baselineUncappedManaBeforeLife = build.calcsTab.mainEnv.player.modDB:Sum("BASE", nil, "DamageTakenFromManaBeforeLife"),
    originalAllocation = originalAllocation, sourceAttributeChoices = sourceAttributeChoices,
    contextUnchangedAfterOverrides = true, weaponNodeIds = weaponAssignments(),
    recoveryCaptured = true, activeWeaponSet = build.itemsTab.activeItemSet.useSecondWeaponSet and 2 or 1,
  }

  for _, candidate in ipairs(audit.candidates) do
    local addNodes, removeNodes = { }, { }
    for _, id in ipairs(candidate.addedNodeIds) do addNodes[build.spec.nodes[tonumber(id)]] = true end
    for _, id in ipairs(candidate.removedNodeIds) do removeNodes[build.spec.nodes[tonumber(id)]] = true end
    local started = os.clock()
    local calculated = calculator({ addNodes = addNodes, removeNodes = removeNodes }, true)
    table.insert(result.candidates, {
      label = candidate.label, pointCost = candidate.pointCost,
      addedCount = #candidate.addedNodeIds, removedCount = #candidate.removedNodeIds,
      overrideOutput = snapshot(calculated), cpuMs = (os.clock() - started) * 1000,
      attributeChoicesPreserved = attributeChoicesMatch(sourceAttributeChoices),
    })
    result.contextUnchangedAfterOverrides = result.contextUnchangedAfterOverrides and equal(protectedContext, context())
    assert(result.contextUnchangedAfterOverrides, "Calculating a route changed the protected build context")
  end
  result.allocationUnchangedAfterOverrides = equal(originalAllocation, sortedIds(build.spec.allocNodes))
  result.baselineAfterOverrides = snapshot(calculator({}, true))

  for index, candidate in ipairs(audit.candidates) do
    local root = copyTable(sourceTree)
    if candidate.label ~= "Original" then
      local tree = assert(child(root, "Tree"))
      local specs = { }
      for _, node in ipairs(tree) do if type(node) == "table" and node.elem == "Spec" then table.insert(specs, node) end end
      local spec = assert(specs[audit.activeSpecIndex])
      local combined = { }
      for _, id in ipairs(candidate.nodeIds) do combined[id] = true end
      for _, id in ipairs(audit.preservedAscendancyNodeIds) do combined[id] = true end
      for _, id in ipairs(audit.preservedWeaponNodeIds) do combined[id] = true end
      spec.attrib.nodes = table.concat(sortedIds(combined), ",")
      local overrides = child(spec, "Overrides")
      if not overrides then overrides = { elem = "Overrides" }; table.insert(spec, overrides) end
      local attributes = child(overrides, "AttributeOverride")
      if not attributes then
        attributes = { elem = "AttributeOverride", attrib = { strNodes = "", dexNodes = "", intNodes = "" } }
        table.insert(overrides, attributes)
      end
      local attributeKey = ({ Strength = "strNodes", Dexterity = "dexNodes", Intelligence = "intNodes" })[audit.newAttributeChoice or "Intelligence"]
      local choices = listIds(attributes.attrib[attributeKey])
      for id in pairs(newAttributes) do if combined[id] then choices[id] = true end end
      attributes.attrib[attributeKey] = table.concat(sortedIds(choices), ",")
    end
    for _, sourceSection in ipairs(sourceTree) do
      if type(sourceSection) == "table" and sourceSection.elem ~= "Tree" then
        assert(equal(sourceSection, child(root, sourceSection.elem)), "A non-tree XML section was changed")
      end
    end
    loadXml(assert(common.xml.ComposeXML(root)))
    result.candidates[index].contextPreservedOnReload = equal(protectedContext, context())
    assert(result.candidates[index].contextPreservedOnReload, "Reloading a candidate changed protected build state")
    local _, calculated = build.calcsTab.calcs.getMiscCalculator(build)
    result.candidates[index].reloadOutput = snapshot(calculated)
    result.candidates[index].recoveryInputs, result.candidates[index].effectCoverage = recoveryInputs(candidate.label)
    result.candidates[index].weaponNodeIdsOnReload = weaponAssignments()
    result.candidates[index].attributeChoicesPreservedOnReload = attributeChoicesMatch(sourceAttributeChoices)
    local mainPoints, ascendancyPoints, _, sockets, weapon1Points, weapon2Points = build.spec:CountAllocNodes()
    result.candidates[index].pobPointCounts = { main = mainPoints, nonWeaponMain = mainPoints - weapon1Points - weapon2Points,
      ascendancy = ascendancyPoints, sockets = sockets, weapon1 = weapon1Points, weapon2 = weapon2Points }
    local missingAllocations = { }
    for _, id in ipairs(candidate.nodeIds) do
      if not build.spec.allocNodes[tonumber(id)] then table.insert(missingAllocations, id) end
    end
    result.candidates[index].missingAllocationsOnReload = missingAllocations
    assert(#missingAllocations == 0, "PoB did not allocate every requested candidate node")
  end

  loadXml(sourceXml)
  local _, restored = build.calcsTab.calcs.getMiscCalculator(build)
  result.finalBaseline = snapshot(restored)
  result.finalContextPreserved = equal(protectedContext, context())
  result.finalAllocationRestored = equal(originalAllocation, sortedIds(build.spec.allocNodes))
  return result
end

loadXml(originalSourceXml)
local originalContext, originalAllocation = copyTable(context(), true), sortedIds(build.spec.allocNodes)
local originalWeaponSet = build.itemsTab.activeItemSet.useSecondWeaponSet and 2 or 1
local sets = (#(audit.preservedWeaponNodeIds or { }) > 0) and { 1, 2 } or { originalWeaponSet }
local scenarios = { }
for _, weaponSet in ipairs(sets) do
  local root = copyTable(originalSourceTree)
  local items = assert(child(root, "Items"))
  local active = items.attrib.activeItemSet or "1"
  local changed = { }
  local function setSelection(element)
    table.insert(changed, { element = element, previous = element.attrib.useSecondWeaponSet })
    element.attrib.useSecondWeaponSet = weaponSet == 2 and "true" or "false"
  end
  setSelection(items)
  for _, itemSet in ipairs(items) do
    if type(itemSet) == "table" and itemSet.elem == "ItemSet" and itemSet.attrib.id == active then setSelection(itemSet) end
  end
  local scenarioXml = assert(common.xml.ComposeXML(root))
  for _, change in ipairs(changed) do change.element.attrib.useSecondWeaponSet = change.previous end
  assert(equal(root, originalSourceTree), "A scenario changed more than active weapon selection")
  scenarios[tostring(weaponSet)] = evaluateScenario(scenarioXml)
  scenarios[tostring(weaponSet)].weaponSet = weaponSet
end
local result = copyTable(scenarios[tostring(originalWeaponSet)], true)
result.weaponSetResults, result.originalActiveWeaponSet = scenarios, originalWeaponSet
loadXml(originalSourceXml)
local _, finalOriginalOutput = build.calcsTab.calcs.getMiscCalculator(build)
result.finalOriginalBaseline = snapshot(finalOriginalOutput)
result.finalOriginalContextPreserved = equal(originalContext, context())
result.finalOriginalAllocationRestored = equal(originalAllocation, sortedIds(build.spec.allocNodes))
assert(result.finalOriginalContextPreserved and result.finalOriginalAllocationRestored, "Original public build was not restored after weapon scenarios")
local file = assert(io.open(job .. "/real-build-results.json", "w"))
file:write(json.encode(result, { indent = true }))
file:close()
print("Wrote real-build evaluation results")
