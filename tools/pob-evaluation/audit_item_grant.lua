dofile(assert(os.getenv("POB_EVALUATION_TOOLS")) .. "/bootstrap.lua")
local job = assert(os.getenv("POB_EVALUATION_JOB"))
local json = require("dkjson")
local targetId, controlId = 56666, 25482
local targetName, controlName = "Thaumaturgic Generator", "Beef"
local function read(name)
  local file = assert(io.open(job .. "/" .. name, "r"))
  local text = file:read("*a"); file:close(); return text
end
local sourceXml = read("source-build.xml")
local audit = assert(json.decode(read("audit-input.json")))
local source = assert(common.xml.ParseXML(sourceXml))[1]
local function child(root, name)
  for _, entry in ipairs(root) do if type(entry) == "table" and entry.elem == name then return entry end end
end
local function equal(a, b)
  if type(a) ~= type(b) then return false end
  if type(a) ~= "table" then return a == b end
  for key, value in pairs(a) do if not equal(value, b[key]) then return false end end
  for key in pairs(b) do if a[key] == nil then return false end end
  return true
end
local function ids(nodes)
  local result = { }; for id in pairs(nodes) do table.insert(result, tostring(id)) end
  table.sort(result); return result
end
local function scalars(output)
  local result = { }
  for key, value in pairs(output) do
    if type(value) == "boolean" or type(value) == "string" or type(value) == "number" and value == value and value ~= math.huge and value ~= -math.huge then
      result[key] = value
    end
  end
  return result
end
local function pointCounts()
  local total, asc, secondary, sockets, w1, w2 = build.spec:CountAllocNodes()
  return { unionMain = total, nonWeaponMain = total - w1 - w2, ascendancy = asc,
    secondaryAscendancy = secondary, sockets = sockets, weapon1 = w1, weapon2 = w2 }
end
local function paidContext()
  local result = { allocation = ids(build.spec.allocNodes), attributes = { },
    weaponModes = { }, jewels = copyTable(build.spec.jewels, true), level = build.characterLevel,
    class = build.spec.curClassName, ascendancy = build.spec.curAscendClassName, mainSocketGroup = build.mainSocketGroup }
  for id, node in pairs(build.spec.allocNodes) do result.weaponModes[tostring(id)] = node.allocMode or 0 end
  for id, node in pairs(build.spec.hashOverrides) do result.attributes[tostring(id)] = table.concat(node.sd or { }, "; ") end
  for _, name in ipairs({ "Skills", "Config" }) do
    local xml = { elem = name }; build.savers[name]:Save(xml); result[name] = xml
  end
  return result
end
local function load(text)
  loadBuildFromXML(text, "Isolated item-grant audit")
  assert(not launch.promptMsg, launch.promptMsg)
  assert(build.targetVersion == liveTargetVersion and build.spec.treeVersion == "0_5", "Build conversion is not permitted")
  assert(build.spec.curClassName == audit.className and build.spec.curAscendClassName == audit.ascendancyName, "Build class context changed")
end
load(sourceXml)
local originalContext = paidContext()
local originalItemContext = { elem = "Items" }; build.savers.Items:Save(originalItemContext)
local originalSet = build.itemsTab.activeItemSet.useSecondWeaponSet and 2 or 1
local _, originalOutput = build.calcsTab.calcs.getMiscCalculator(build)
local originalScalars = scalars(originalOutput)
local sourceItems = assert(child(source, "Items"))
local activeItemSetId = sourceItems.attrib.activeItemSet or "1"
local activeItemSet
for _, entry in ipairs(sourceItems) do
  if type(entry) == "table" and entry.elem == "ItemSet" and entry.attrib.id == activeItemSetId then activeItemSet = entry end
end
local amuletId
for _, slot in ipairs(assert(activeItemSet)) do
  if type(slot) == "table" and slot.elem == "Slot" and slot.attrib.name == "Amulet" then amuletId = slot.attrib.itemId end
end
assert(amuletId and amuletId ~= "0", "The source needs an equipped amulet")
local function nonGrantAmuletMods()
  local result = { }
  local item = assert(build.itemsTab.items[tonumber(amuletId)])
  for _, category in ipairs({ "enchantModLines", "implicitModLines", "explicitModLines", "runeModLines" }) do
    result[category] = { }
    for _, mod in ipairs(item[category]) do
      if mod.line ~= "Allocates " .. targetName and mod.line ~= "Allocates " .. controlName then
        table.insert(result[category], mod.line)
      end
    end
  end
  return result
end
local originalAmuletMods = nonGrantAmuletMods()
assert(not build.spec.allocNodes[targetId] and not build.spec.allocNodes[controlId], "Probe nodes must not already be paid allocations")
local grantMods, grantExtra = modLib.parseMod("Allocates " .. targetName)
local effectMods, effectExtra = modLib.parseMod("Grants Thaumaturgical Dynamism")
local result = {
  engineVersion = launch.versionNumber, treeVersion = build.spec.treeVersion, sourceUrl = audit.sourceUrl,
  sourceXmlSha256 = audit.sourceXmlSha256,
  originalActiveWeaponSet = originalSet, amuletItemId = amuletId,
  target = { id = tostring(targetId), name = targetName, descriptions = copyTable(assert(build.spec.nodes[targetId]).sd, true),
    parsedEffectModCount = effectMods and #effectMods or 0, unrecognizedEffectText = effectExtra,
    parsedGrantModCount = grantMods and #grantMods or 0, grantLineFullyParsed = grantMods ~= nil and not grantExtra,
    grantModNames = { }, definitionModCount = #(build.spec.nodes[targetId].modList or { }) },
  control = { id = tostring(controlId), name = controlName, descriptions = copyTable(assert(build.spec.nodes[controlId]).sd, true) },
  cases = { },
}
for _, mod in ipairs(grantMods or { }) do table.insert(result.target.grantModNames, mod.name) end

local variants = { "Original", "Without grant", "Beef control", "Original restored" }
for _, weaponSet in ipairs({ 1, 2 }) do
  for _, variant in ipairs(variants) do
    local root = copyTable(source)
    local items = assert(child(root, "Items"))
    items.attrib.useSecondWeaponSet = weaponSet == 2 and "true" or "false"
    local changedLines, implicitCountChanges = 0, 0
    for _, entry in ipairs(items) do
      if type(entry) == "table" and entry.elem == "ItemSet" and entry.attrib.id == activeItemSetId then
        entry.attrib.useSecondWeaponSet = weaponSet == 2 and "true" or "false"
      elseif type(entry) == "table" and entry.elem == "Item" and entry.attrib.id == amuletId and (variant == "Without grant" or variant == "Beef control") then
        for index, text in ipairs(entry) do
          if type(text) == "string" then
            entry[index] = text:gsub("[^\r\n]+", function(line)
              local normalized = line:gsub("^%s+", ""):gsub("%s+$", ""):gsub("%b{}", "")
              if normalized == "Allocates " .. targetName then
                changedLines = changedLines + 1
                return variant == "Without grant" and "" or line:gsub(targetName, controlName)
              end
              -- PoB counts the enchanted line in Implicits; keep all remaining mod categories unchanged.
              local implicitCount = normalized:match("^Implicits: (%d+)$")
              if implicitCount and variant == "Without grant" then
                assert(tonumber(implicitCount) > 0, "Expected at least one implicit")
                implicitCountChanges = implicitCountChanges + 1
                return line:gsub("Implicits: %d+", "Implicits: " .. (tonumber(implicitCount) - 1))
              end
              return line
            end)
          end
        end
      end
    end
    assert(changedLines == ((variant == "Without grant" or variant == "Beef control") and 1 or 0), "Exactly one intended anoint line must change: " .. variant .. ", item " .. tostring(amuletId) .. ", changed " .. changedLines)
    assert(implicitCountChanges == (variant == "Without grant" and 1 or 0), "Incorrect implicit bookkeeping")
    for _, section in ipairs(source) do
      if type(section) == "table" and section.elem ~= "Items" then assert(equal(section, child(root, section.elem)), "Non-item XML changed") end
    end
    local normalizedItems = copyTable(items)
    normalizedItems.attrib = copyTable(sourceItems.attrib, true)
    for index, entry in ipairs(normalizedItems) do
      local original = sourceItems[index]
      if type(entry) == "table" and entry.elem == "ItemSet" then entry.attrib = copyTable(original.attrib, true) end
      if type(entry) == "table" and entry.elem == "Item" and entry.attrib.id == amuletId then
        local function otherLines(item)
          local lines = { }
          for _, text in ipairs(item) do if type(text) == "string" then
            for line in text:gmatch("[^\r\n]+") do
              local cleaned = line:gsub("^%s+", ""):gsub("%s+$", ""):gsub("%b{}", "")
              if cleaned ~= "" and not cleaned:match("^Implicits: %d+$") and cleaned ~= "Allocates " .. targetName and cleaned ~= "Allocates " .. controlName then table.insert(lines, line) end
            end
          end end
          return lines
        end
        assert(equal(otherLines(entry), otherLines(original)), "Non-anoint amulet text changed")
        normalizedItems[index] = copyTable(original)
      end
    end
    assert(equal(normalizedItems, sourceItems), "An unrelated item or item-set value changed")
    load(assert(common.xml.ComposeXML(root)))
    assert(equal(originalContext, paidContext()), "A paid allocation, jewel, attribute, skill or configuration changed")
    assert(equal(originalAmuletMods, nonGrantAmuletMods()), "A non-anoint parsed mod or its category changed")
    local calculator, output = build.calcsTab.calcs.getMiscCalculator(build)
    local env = build.calcsTab.calcs.initEnv(build, "CALCULATOR")
    build.calcsTab.calcs.perform(env)
    local grantedIds = ids(env.grantedPassives)
    local targetActive = env.grantedPassives[targetId] == true
    local controlActive = env.grantedPassives[controlId] == true
    table.insert(result.cases, {
      weaponSet = weaponSet, variant = variant, changedAnointLineCount = changedLines,
      implicitCountChanges = implicitCountChanges,
      paidContextPreserved = equal(originalContext, paidContext()), counts = pointCounts(), output = scalars(output),
      nonAnointItemTextPreserved = true,
      nonAnointParsedModsPreserved = true,
      targetGrantedInCalculation = targetActive, controlGrantedInCalculation = controlActive,
      targetInPaidAllocation = build.spec.allocNodes[targetId] ~= nil, controlInPaidAllocation = build.spec.allocNodes[controlId] ~= nil,
      targetInCalculationNodes = env.allocNodes[targetId] ~= nil, grantedNodeIds = grantedIds,
      resolvedTargetIds = ids((function()
        local map = { }; for _, node in ipairs(build.spec:ResolveGrantedPassiveNodes(targetName)) do map[node.id] = true end; return map
      end)()),
      envStrength = env.player.output.Str, envDamage = env.player.output.CombinedDPS,
    })
  end
end
load(sourceXml)
local _, finalOutput = build.calcsTab.calcs.getMiscCalculator(build)
local finalItems = { elem = "Items" }; build.savers.Items:Save(finalItems)
result.originalContextRestored = equal(originalContext, paidContext()) and equal(originalItemContext, finalItems)
result.originalOutputsRestored = equal(originalScalars, scalars(finalOutput))
result.originalWeaponSelectionRestored = originalSet == (build.itemsTab.activeItemSet.useSecondWeaponSet and 2 or 1)
assert(result.originalContextRestored and result.originalOutputsRestored and result.originalWeaponSelectionRestored, "Original source state was not restored")
local file = assert(io.open(job .. "/item-grant-audit.json", "w"))
file:write(json.encode(result, { indent = true })); file:close()
print("Wrote isolated item-grant audit")
