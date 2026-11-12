local gems = dofile("Data/Gems.lua")
local json = dofile("lua/dkjson.lua")
local rows = { }
for id, gem in pairs(gems) do
  rows[#rows + 1] = {
    id = id, name = gem.name, effectId = gem.grantedEffectId,
    type = gem.gemType, family = gem.gemFamily, tier = gem.Tier,
    support = gem.gemType == "Support" or (gem.tags or { }).support == true,
  }
end
table.sort(rows, function(a, b) return a.id < b.id end)
local file = assert(io.open(assert(os.getenv("POB_EVALUATION_JOB")) .. "/gems.json", "w"))
file:write(assert(json.encode(rows)))
file:close()
print("Exported " .. #rows .. " catalog entries")
