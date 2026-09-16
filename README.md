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
- `extensions/setup/index.ts` — registers a `/pi-setup` command so the package can re-hydrate
  a machine from its bundled provenance files.

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

## Restore on a new machine (easy, via `pi install`)

Because this is a pi package with a bundled setup *extension*, installing it gives you a
`/pi-setup` command that re-hydrates the machine from the provenance files (keeping provenance,
not vendoring public skill/package bytes):

```bash
# 1. Install the package (Git source keeps the bundled configs accessible to the extension):
pi install git:github.com/mikeygh/pi-setup

# 2. Reload so the extension registers, then run its setup command:
/reload
/pi-setup            # copies settings.json, models-store.json, quotas.json, skills-lock.json
                     # into ~/.pi and ~/.agents (originals backed up to *.bak-<timestamp>)

# 3. Restore skills from the lockfile:
bunx skills experimental_install

# 4. Restart pi — it auto-installs the extensions listed in settings.json `packages`.
```

`/pi-setup --dry-run` previews changes without writing; `/pi-setup --yes` skips the confirm. It is
**not** auto-run on load, so it can never change your setup without you asking.

### Manual fallback (no `pi install`)

```bash
cp settings.json ~/.pi/agent/settings.json
cp skills-lock.json ~/.agents/.skill-lock.json
cp models-store.json ~/.pi/agent/models-store.json
mkdir -p ~/.pi/agent/extensions && cp extensions/quotas.json ~/.pi/agent/extensions/quotas.json
bunx skills experimental_install
```

The 5 public skill repos behind `skills-lock.json`:
mattpocock/skills · obra/superpowers · vercel-labs/agent-skills · vercel-labs/skills · xixu-me/skills