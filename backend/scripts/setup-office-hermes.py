"""Create isolated office homes from the user's existing Hermes inference config.

No plugins, hooks, channels, personal memories, skills or sessions are imported.
No backend/database is started. Credential files remain in ignored .local/.
"""
import json
import os
import sys
from pathlib import Path
import yaml
from dotenv import dotenv_values

ROLES = ("manager", "strategy", "research", "creative", "operations")

def setup():
    website = Path(__file__).resolve().parents[2]
    local = website / ".local" / "digital-office"
    pairing = local / "worker.json"
    destination = local / "hermes-worker.json"
    if destination.exists():
        raise ValueError("Konfigurasi Hermes kantor sudah ada; tidak ditimpa.")
    source = Path(os.environ.get("NAKI_HERMES_SOURCE_HOME", str(Path.home() / ".hermes")))
    config = yaml.safe_load((source / "config.yaml").read_text(encoding="utf-8")) or {}
    model = config.get("model")
    if not model:
        raise ValueError("Konfigurasi model Hermes belum tersedia.")
    # Only inference settings travel, excluding all executable customization.
    minimal = {"model": model, "agent": {"max_turns": 8}, "display": {"interface": "cli"}}
    if config.get("providers"):
        minimal["providers"] = config["providers"]
    secrets = dotenv_values(source / ".env")
    allowed = {"OPENAI_API_KEY", "OPENAI_BASE_URL", "ANTHROPIC_API_KEY", "OPENROUTER_API_KEY", "NOUS_API_KEY"}
    # Include only env references actually used by inference config.
    import re
    allowed.update(re.findall(r"\$\{(?:env:)?([A-Z][A-Z0-9_]+)\}", yaml.safe_dump(minimal)))
    root = local / "hermes"
    for role in ROLES:
        home = root / "profiles" / ("naki-" + role)
        if home.exists():
            raise ValueError("Folder profil sudah ada; setup tidak menimpa memori.")
    worker = json.loads(pairing.read_text(encoding="utf-8-sig"))
    for role in ROLES:
        home = root / "profiles" / ("naki-" + role)
        home.mkdir(parents=True)
        (home / "config.yaml").write_text(yaml.safe_dump(minimal, sort_keys=False), encoding="utf-8")
        # JSON quoting is accepted by python-dotenv and preserves embedded punctuation.
        env_text = "".join(k + "=" + json.dumps(v) + "\n" for k, v in secrets.items() if k in allowed and v is not None)
        (home / ".env").write_text(env_text, encoding="utf-8")
        (home / "SOUL.md").write_text(
            f"Anda adalah {role} NAKI CEO Office. Jawab dalam bahasa Indonesia. "
            "Konteks stabil dan preferensi CEO boleh disimpan melalui tool memory. "
            "Pisahkan fakta, asumsi, dan hal yang belum diverifikasi. "
            "Keluaran adalah draft. Jangan mengaku melakukan tindakan eksternal. "
            "Jangan menyimpan credential atau data sensitif dalam memory.\n", encoding="utf-8")
    worker.update(engine="hermes", hermesPython=sys.executable, hermesHome=str(root))
    with destination.open("x", encoding="utf-8") as stream:
        json.dump(worker, stream, indent=2)
    print("Lima profil Hermes dan konfigurasi worker siap. Secret tidak ditampilkan.")
    print("Setup tidak memulai backend, worker, atau Telegram.")

if __name__ == "__main__":
    try:
        setup()
    except Exception:
        print("Setup Hermes belum selesai. Periksa pairing worker, model Hermes, dan folder profil existing.", file=sys.stderr)
        raise SystemExit(1)
