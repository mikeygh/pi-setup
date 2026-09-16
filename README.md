# pi-setup

Snapshot/backup of my personal [pi](https://pi.dev) coding agent configuration, tracked as a [pi package](https://pi.dev/packages).

## What's tracked

- `settings.json` — live pi config (`~/.pi/agent/settings.json`): provider, model,
  `enabledModels`, `packages` (npm extensions), `codepi.modes`, thinking level, theme.
- `AGENTS.md` — global agent instructions.
- `APPEND_SYSTEM.md` — system prompt appendix (language preference for crypto/computation).
- `models-store.json` — model catalog (Big Pickle et al.).
- `extensions/`
  - `quotas.json` — pi-quotas runtime config.
  - `vendor/@latentminds-pi-quotas/` — vendored source of the pi-quotas extension.
  - `vendor/pi-rate-limit/` — vendored source of the pi-rate-limit extension.
- `skills/`, `themes/`, `prompts/` — reserved package dirs (skills master lives at
  `~/.agents/skills`, currently not vendored here).

## Intentional exclusions (not committed)

- `npm/` — installed deps for the `packages` list; recreated by `pi install`.
- `auth.json` — API keys/credentials.
- `trust.json`, `sessions/`, `bin/`, `models` scratch — machine-local state.
- `pi-opencode-bridge` — provider extension (can be reinstalled via `packages`).

## Sync from live setup

```bash
cp ~/.pi/agent/settings.json settings.json
cp ~/.pi/agent/AGENTS.md AGENTS.md
cp ~/.pi/agent/APPEND_SYSTEM.md APPEND_SYSTEM.md
cp ~/.pi/agent/models-store.json models-store.json
cp ~/.pi/agent/extensions/quotas.json extensions/quotas.json
```

## Restore on a new machine

```bash
pi install /path/to/pi-setup
# `packages` in settings installs the npm extensions automatically.
```

See the [pi packages docs](https://pi.dev/docs) for manifest details.