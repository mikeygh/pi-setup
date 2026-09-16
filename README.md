# pi-setup

Snapshot/backup of my personal [pi](https://pi.dev) coding agent configuration, plus the
**provenance** I need to reproduce that setup on another machine.

## What's tracked

- `settings.json` — live pi config (`~/.pi/agent/settings.json`): provider, model,
  `enabledModels`, `packages` (npm extensions), `codepi.modes`, thinking level, theme.
- `AGENTS.md` — global agent instructions.
- `APPEND_SYSTEM.md` — system prompt appendix (language preference for crypto/computation).
- `models-store.json` — model catalog (Big Pickle et al.).
- `skills-lock.json` — **skill provenance manifest** (copied from `~/.agents/.skill-lock.json`).
  Records the source repo + path of every installed skill so they can be reinstalled.
- `extensions/quotas.json` — pi-quotas runtime config (extension itself installs via `packages`).

## What is NOT vendored, and why

Skills and public packages are **reproducible from source**, so only their provenance is stored —
not their bytes.

- **Skills** — all 65 come from 5 public repos (mattpocock/skills, obra/superpowers,
  vercel-labs/agent-skills, vercel-labs/skills, xixu-me/skills), recorded in `skills-lock.json`.
- **Extensions** — `pi-quotas`, `pi-rate-limit`, `pi-opencode-bridge` are public npm packages,
  referenced by the `packages` array in `settings.json`.
- **Not committed** (local secrets/state): `auth.json`, `trust.json`, `sessions/`, `npm/`, `bin/`.

## Sync from live setup

```bash
cp ~/.pi/agent/settings.json settings.json
cp ~/.pi/agent/AGENTS.md AGENTS.md
cp ~/.pi/agent/APPEND_SYSTEM.md APPEND_SYSTEM.md
cp ~/.pi/agent/models-store.json models-store.json
cp ~/.agents/.skill-lock.json skills-lock.json
cp ~/.pi/agent/extensions/quotas.json extensions/quotas.json
```

## Restore on a new machine

```bash
# 1. Extensions — install via the npm packages listed in settings.json:
pi install npm:@latentminds/pi-quotas
pi install npm:pi-rate-limit
pi install npm:pi-opencode-bridge

# 2. Skills — restore from the provenance manifest:
cp skills-lock.json ~/.agents/.skill-lock.json
# then run the skills CLI restore, e.g.:
bunx skills experimental_install
```

The 5 public skill repos behind `skills-lock.json`:
mattpocock/skills · obra/superpowers · vercel-labs/agent-skills · vercel-labs/skills · xixu-me/skills