local function array() return setmetatable({ }, { __jsontype = "array" }) end
local function sortedKeys(map)
  local keys = { }; for key in pairs(map) do table.insert(keys, key) end
  table.sort(keys, function(a, b) return tostring(a) < tostring(b) end); return keys
end
local function trimmed(text) return text and text:match("^%s*(.-)%s*$") or "" end

-- Native parser evidence only. A parsed line is not proof of complete mechanic support.
return function(env, sourceHash, label)
  local build = env.build
  local weaponSet = build.itemsTab.activeItemSet.useSecondWeaponSet and 2 or 1
  local report = { version = 1, sourceXmlSha256 = sourceHash, engineVersion = launch.versionNumber,
    treeVersion = build.spec.treeVersion, candidateLabel = label, weaponSet = weaponSet,
    lines = array(), nodes = array(), items = array(), grants = array(), customLineCount = 0 }
  local function line(owner, index, text, mods, extra, evidenceAvailable)
    if trimmed(text) == "" then return end
    local entry = copyTable(owner)
    entry.index, entry.text = index, text
    entry.parsedModCount = mods and #mods or 0
    entry.parseStatus = not evidenceAvailable and "unavailable" or (trimmed(extra) ~= "" and (entry.parsedModCount > 0 and "partial" or "unparsed") or (mods and "parsed" or "unparsed"))
    if trimmed(extra) ~= "" then entry.unrecognizedText = extra end
    table.insert(report.lines, entry)
  end
  for _, id in ipairs(sortedKeys(env.allocNodes)) do
    local node = env.allocNodes[id]
    local granted = env.grantedPassives[id] == true
    if granted or not node.allocMode or node.allocMode == 0 or node.allocMode == weaponSet then
      local owner = { kind = "passive", ownerId = tostring(id), ownerName = node.dn or node.name or tostring(id), granted = granted }
      table.insert(report.nodes, { id = tostring(id), name = owner.ownerName, granted = granted,
        paid = build.spec.allocNodes[id] ~= nil and not node.isFreeAllocate and node.type ~= "ClassStart" and node.type ~= "AscendClassStart",
        descriptionLineCount = #(node.sd or { }) })
      for index, text in ipairs(node.sd or { }) do
        local parsed = node.mods and node.mods[index]
        -- PoB uses empty successful lists for continuation lines of combined descriptions.
        line(owner, index, text, parsed and parsed.list, parsed and parsed.extra, parsed ~= nil)
      end
    end
  end
  local equipped = { }
  for slot, item in pairs(env.player.itemList) do equipped[slot] = item end
  for item in pairs(env.flasks or { }) do equipped["Active flask " .. tostring(item.id)] = item end
  for item in pairs(env.charms or { }) do equipped["Active charm " .. tostring(item.id)] = item end
  for _, slot in ipairs(sortedKeys(equipped)) do
    local item = equipped[slot]
    local itemEvidence = { id = tostring(item.id), name = item.name or item.title or item.baseName or tostring(item.id), slot = slot, lineCount = 0 }
    table.insert(report.items, itemEvidence)
    for _, category in ipairs({ "enchantModLines", "implicitModLines", "explicitModLines", "runeModLines" }) do
      for index, mod in ipairs(item[category] or { }) do
        if item:CheckModLineVariant(mod) then
          line({ kind = "item", ownerId = tostring(item.id), ownerName = item.name or item.title or tostring(item.id), slot = slot, category = category },
            index, mod.line, mod.modList, mod.extra, true)
          if trimmed(mod.line) ~= "" then itemEvidence.lineCount = itemEvidence.lineCount + 1 end
        end
      end
    end
  end
  local index = 0
  for text in (env.configInput.customMods or ""):gmatch("[^\n]+") do
    index = index + 1
    local cleaned = StripEscapes(text):gsub("^[%s?]+", ""):gsub("[%s?]+$", "")
    if cleaned ~= "" then
      report.customLineCount = report.customLineCount + 1
      local mods, extra = modLib.parseMod(cleaned)
      line({ kind = "custom", ownerId = "active-config", ownerName = "Active custom modifiers" }, index, cleaned, mods, extra, true)
    end
  end
  for _, passive in ipairs(env.modDB:List(nil, "GrantedPassive")) do
    local grant = { name = type(passive) == "string" and passive or (type(passive) == "table" and passive.type or "Unknown structured grant"),
      structured = type(passive) ~= "string", resolvedNodeIds = array(), appliedNodeIds = array() }
    for _, node in ipairs(env.spec:ResolveGrantedPassiveNodes(passive)) do
      table.insert(grant.resolvedNodeIds, tostring(node.id))
      if env.grantedPassives[node.id] then table.insert(grant.appliedNodeIds, tostring(node.id)) end
    end
    table.sort(grant.resolvedNodeIds); table.sort(grant.appliedNodeIds)
    table.insert(report.grants, grant)
  end
  table.sort(report.grants, function(a, b) return a.name < b.name end)
  return report
end
