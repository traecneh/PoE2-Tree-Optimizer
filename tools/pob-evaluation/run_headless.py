"""Run the PoB evaluation experiment using an isolated Windows LuaJIT runtime."""

import argparse
import ctypes
import json
import hashlib
import os
from pathlib import Path
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("runtime", type=Path)
    parser.add_argument("--driver", type=Path, default=Path(__file__).with_name("evaluate.lua"))
    parser.add_argument("--job", type=Path, help="An existing audit job directory under var")
    args = parser.parse_args()
    runtime = args.runtime.resolve(strict=True)
    driver = args.driver.resolve(strict=True)
    workspace = Path(__file__).resolve().parents[2] / "var"
    if not runtime.is_relative_to(workspace) or not (runtime / ".pob-evaluation-runtime.json").is_file():
        parser.error("Only marked experiment copies under this repository's var folder may be used.")
    metadata = json.loads((runtime / ".pob-evaluation-runtime.json").read_text(encoding="utf-8-sig"))
    if metadata.get("kind") != "isolated-pob-evaluation-copy":
        parser.error("The runtime is not marked as an isolated PoB evaluation copy.")
    if (runtime / "installed.cfg").exists():
        parser.error("Refusing an installed PoB directory. Use an isolated runtime copy.")
    if not (runtime / "HeadlessWrapper.lua").is_file():
        parser.error("The isolated runtime needs PoB's official headless support files.")
    job = args.job.resolve(strict=True) if args.job else runtime.parent
    if not job.is_relative_to(workspace):
        parser.error("Audit job files must remain under this repository's var folder.")

    if driver.name in {"evaluate_real_build.lua", "audit_item_grant.lua"}:
        report_path = job / "import-preflight.json"
        if not report_path.is_file():
            parser.error("Run the import compatibility preflight before evaluating a real build.")
        report = json.loads(report_path.read_text(encoding="utf-8-sig"))
        source_path = job / "source-build.xml"
        if (report.get("version") != 1 or report.get("canGenerateRoutes") is not True
                or report.get("status") != "ready_for_audit"
                or not isinstance(report.get("findings"), list)
                or any(finding.get("severity") == "blocker" for finding in report.get("findings", []))):
            parser.error("Import compatibility preflight blocked this job; inspect import-preflight.json.")
        if not source_path.is_file() or hashlib.sha256(source_path.read_bytes()).hexdigest() != report.get("sourceXmlSha256"):
            parser.error("The preflight does not match the job's source XML. Re-run preparation in a fresh job directory.")
        try:
            audit = json.loads((job / "audit-input.json").read_text(encoding="utf-8-sig"))
        except (OSError, ValueError):
            parser.error("Preparation metadata is missing or unreadable. Re-run preparation.")
        if (audit.get("sourceXmlSha256") != report.get("sourceXmlSha256")
                or audit.get("graphVersion") != report.get("graphVersion")
                or audit.get("validationProfile", "ci-mana") != report.get("requestedProfile")):
            parser.error("Preparation metadata does not match the import preflight. Re-run preparation.")
        generation_path = job / "generation-preflight.json"
        if generation_path.is_file() or audit.get("generation"):
            if not generation_path.is_file():
                parser.error("Generation preparation evidence is missing.")
            generation = json.loads(generation_path.read_text(encoding="utf-8-sig"))
            if (generation.get("version") != 1 or generation.get("status") != "ready"
                    or generation.get("auditInputSha256") != hashlib.sha256((job / "audit-input.json").read_bytes()).hexdigest()):
                parser.error("Generation preparation is blocked or does not match this manifest. Use a fresh job.")

    with os.add_dll_directory(str(runtime)):
        lua = ctypes.CDLL(str(runtime / "lua51.dll"))
        lua.luaL_newstate.restype = ctypes.c_void_p
        lua.luaL_openlibs.argtypes = [ctypes.c_void_p]
        lua.luaL_loadfile.argtypes = [ctypes.c_void_p, ctypes.c_char_p]
        lua.luaL_loadfile.restype = ctypes.c_int
        lua.lua_pcall.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.c_int, ctypes.c_int]
        lua.lua_pcall.restype = ctypes.c_int
        lua.lua_tolstring.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.POINTER(ctypes.c_size_t)]
        lua.lua_tolstring.restype = ctypes.c_char_p
        lua.lua_close.argtypes = [ctypes.c_void_p]

        state = lua.luaL_newstate()
        if not state:
            raise RuntimeError("LuaJIT could not allocate a state.")
        previous_directory = Path.cwd()
        previous_environment = {name: os.environ.get(name) for name in ("POB_EVALUATION_TOOLS", "POB_EVALUATION_JOB")}
        try:
            os.environ["POB_EVALUATION_TOOLS"] = str(Path(__file__).resolve().parent)
            os.environ["POB_EVALUATION_JOB"] = str(job)
            os.chdir(runtime)
            lua.luaL_openlibs(state)
            status = lua.luaL_loadfile(state, os.fsencode(driver))
            if not status:
                status = lua.lua_pcall(state, 0, 0, 0)
            if status:
                message = lua.lua_tolstring(state, -1, None)
                print(message.decode("utf-8", errors="replace") if message else "Unknown Lua error", file=sys.stderr)
                return 1
        finally:
            lua.lua_close(state)
            os.chdir(previous_directory)
            for name, value in previous_environment.items():
                if value is None:
                    os.environ.pop(name, None)
                else:
                    os.environ[name] = value
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
