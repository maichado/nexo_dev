"""Skill-only Hermes plugin for Nexo.

Registers the packaged Nexo SKILL.md. It does not add native render tools,
network, credentials, or a Python rewrite of the Node compiler. Hermes follows
the skill and runs `node bin/nexo.mjs` through its ordinary terminal tool.
"""

from __future__ import annotations

import os
from pathlib import Path

_PLUGIN_DIR = Path(__file__).resolve().parent
_SKILL_DESCRIPTION = (
    "Create polished, validated architecture, workflow, sequence, data-flow, "
    "lifecycle, ERD, class, tree, timeline, and waterfall diagrams as standalone HTML. "
    "Use when the user asks to "
    "visualize system architecture, infrastructure, workflows, API sequences, "
    "data pipelines, state machines, database schemas, class relationships, "
    "hierarchies, schedules, or timing breakdowns."
)


def _hermes_home() -> Path:
    configured = os.environ.get("HERMES_HOME", "").strip()
    if configured:
        return Path(configured).expanduser()
    return Path.home() / ".hermes"


def skill_md_candidates() -> list[Path]:
    candidates = [_PLUGIN_DIR / "skills" / "nexo" / "SKILL.md"]
    integrations_dir = _PLUGIN_DIR.parent
    if integrations_dir.name == "integrations":
        candidates.append(integrations_dir.parent / "nexo" / "SKILL.md")
    skill_root = os.environ.get("NEXO_SKILL_ROOT", "").strip()
    if skill_root:
        candidates.append(Path(skill_root).expanduser() / "SKILL.md")
    candidates.append(_hermes_home() / "skills" / "nexo" / "SKILL.md")
    return candidates


def resolve_skill_md() -> Path:
    seen: set[Path] = set()
    for candidate in skill_md_candidates():
        resolved = candidate
        if resolved in seen:
            continue
        seen.add(resolved)
        if resolved.is_file():
            return resolved
    searched = ", ".join(str(path) for path in seen)
    raise FileNotFoundError(
        "nexo plugin: SKILL.md not found. Install the Skill with a symlink "
        "to ~/.hermes/skills/nexo, keep this plugin inside the Nexo "
        f"checkout, or set NEXO_SKILL_ROOT. Looked in: {searched}."
    )


def register(ctx) -> None:
    ctx.register_skill("nexo", resolve_skill_md(), description=_SKILL_DESCRIPTION)
