dofile(assert(os.getenv("POB_EVALUATION_TOOLS")) .. "/bootstrap.lua")
local collect = dofile(assert(os.getenv("POB_EVALUATION_TOOLS")) .. "/effect_coverage.lua")
local function node(id, mode, descriptions, mods)
  return { id = id, dn = "Probe " .. id, allocMode = mode, sd = descriptions, mods = mods, type = "Normal" }
end
local known = node(1, 0, { "+5 to Strength" }, { { list = { { name = "Str" } } } })
local combined = node(2, 0, { "A combined description", "continued on another line" }, { { list = { { name = "Known" } } }, { list = { } } })
local opposite = node(3, 2, { "Opposite weapon set unsupported effect" }, { { extra = "Unsupported" } })
local granted = node(56666, 0, { "Grants Thaumaturgical Dynamism" }, { { extra = "Grants Thaumaturgical Dynamism " } })
local item = { id = 27, name = "Equipped probe", explicitModLines = {
  { line = "+5 to Strength", modList = { { name = "Str" } } },
  { line = "Inactive variant unsupported effect", active = false, modList = { }, extra = "Unsupported" },
  { line = "Partial effect", modList = { { name = "Known" } }, extra = "Unknown remainder" },
} }
function item:CheckModLineVariant(mod) return mod.active ~= false end
local spec = { treeVersion = "0_5", allocNodes = { [1] = known, [2] = combined, [3] = opposite } }
function spec:ResolveGrantedPassiveNodes(name) return name == "Known grant" and { granted } or { } end
local env = { build = { spec = spec, itemsTab = { activeItemSet = { useSecondWeaponSet = false } } }, spec = spec,
  allocNodes = { [1] = known, [2] = combined, [3] = opposite, [56666] = granted }, grantedPassives = { [56666] = true },
  player = { itemList = { Amulet = item } }, configInput = { customMods = "+5 to Strength\n??? Unknown probe effect\n" }, modDB = { } }
function env.modDB:List() return { "Known grant", "Unknown grant" } end
local report = collect(env, "fixture-hash", "Original")
assert(report.sourceXmlSha256 == "fixture-hash" and report.weaponSet == 1)
assert(#report.nodes == 3, "Opposite set was scanned as active")
assert(#report.items == 1 and report.items[1].lineCount == 2, "Inactive item variant leaked")
assert(#report.lines == 8 and report.customLineCount == 2, "Incorrect native record counts")
local byText = { }; for _, line in ipairs(report.lines) do byText[line.text] = line end
assert(not byText["Opposite weapon set unsupported effect"] and not byText["Inactive variant unsupported effect"])
assert(byText["continued on another line"].parseStatus == "parsed", "Combined native parse was incorrectly reparsed line-by-line")
assert(byText["Partial effect"].parseStatus == "partial")
assert(byText["Grants Thaumaturgical Dynamism"].parseStatus == "unparsed")
assert(byText["Unknown probe effect"].kind == "custom" and byText["Unknown probe effect"].parseStatus == "unparsed")
assert(#report.grants == 2 and #report.grants[1].appliedNodeIds == 1 and #report.grants[2].resolvedNodeIds == 0)
assert(env.allocNodes[3] == opposite and item.explicitModLines[2].active == false, "Coverage mutated source state")
env.build.itemsTab.activeItemSet.useSecondWeaponSet = true
local second = collect(env, "fixture-hash", "Original")
assert(second.weaponSet == 2 and #second.nodes == 4, "Selected set was not inspected")
print("Passed native effect-coverage collector checks")
