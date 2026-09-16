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
- `sync.sh` — one-command refresh of the above from `~/.pi` + `~/.agents`.

## What is NOT vendored, and why

Skills and public packages are **reproducible from source**, so only their provenance is stored —
not their bytes.

- **Skills** — all 65 come from 5 public repos (mattpocock/skills, obra/superpowers,
  vercel-labs/agent-skills, vercel-labs/skills, xixu-me/skills), recorded in `skills-lock.json`.
- **Extensions** — `pi-quotas`, `pi-rate-limit`, `pi-opencode-bridge` are public npm packages,
  referenced by the `packages` array in `settings.json`.
- **Not committed** (local secrets/state): `auth.json`, `trust.json`, `sessions/`, `npm/`, `bin/`.

## Refresh from the live setup

```bash
./sync.sh          # copy files, show what changed
./sync.sh -c       # copy + commit
./sync.sh -p       # copy + commit + push to origin
```

## Restore on a new machine

> Note: `pi install` on this repo registers the package but ships no loadable resources
> (themes/prompts are empty and skills/extensions are provenance-only). Restoring your actual
> setup uses the reference copies directly:

```bash
# 1. Config + extensions — pi auto-installs the `packages` list on next start:
cp settings.json ~/.pi/agent/settings.json

# 2. Skills — restore from the provenance manifest:
cp skills-lock.json ~/.agents/.skill-lock.json
bunx skills experimental_install
```

The 5 public skill repos behind `skills-lock.json`:
mattpocock/skills · obra/superpowers · vercel-labs/agent-skills · vercel-labs/skills · xixu-me/skills