"""Use the installed Hermes CLI with a stdin brief and clean stdout response."""
import json
import os
import sys
from pathlib import Path

# The installed Hermes Python lives in <checkout>/venv/Scripts/python.exe.
source = Path(sys.executable).resolve().parents[2]
if not (source / "cli.py").is_file():
    raise SystemExit("Hermes source tidak ditemukan.")
sys.path.insert(0, str(source))
request = json.load(sys.stdin)
os.environ["HERMES_SESSION_SOURCE"] = "naki-office"
# Only the profile's curated identity, native memory and inference settings are used.
os.environ.pop("HERMES_IGNORE_RULES", None)
os.environ.pop("HERMES_IGNORE_USER_CONFIG", None)
os.environ.pop("HERMES_SAFE_MODE", None)
from cli import main

main(query=request["prompt"], quiet=True, toolsets="memory", max_turns=8)
