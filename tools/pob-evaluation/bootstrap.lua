package.path = "./lua/?.lua;./lua/?/init.lua;./?.lua;" .. package.path
package.cpath = "./?.dll;" .. package.cpath
arg = { }

local originalDofile = dofile
function dofile(path)
  local result = originalDofile(path)
  if path == "_SimpleGraphic.def.lua" then
    function GetTime() return math.floor(os.clock() * 1000) end
    function GetScriptPath() return "." end
    function GetRuntimePath() return "." end
    function GetUserPath() error("User profile access is disabled in this experiment") end
    function OpenURL() error("Network/browser access is disabled in this experiment") end
    function LaunchSubScript() return 0 end
    function MakeDir() return true end
    function GetVirtualScreenSize() return 1920, 1080 end
  elseif path == "Launch.lua" then
    function launch:CheckForUpdate() end
  end
  return result
end

dofile("HeadlessWrapper.lua")
assert(not launch.promptMsg, launch.promptMsg)
