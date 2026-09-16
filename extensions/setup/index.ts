/**
 * pi-setup /pi-setup command
 *
 * Re-hydrates a pi install from this package's bundled provenance/config files.
 * The package ships only small, self-authored files (settings, model catalog,
 * skills lockfile, quota config) — NOT vendored public skill/package bytes.
 *
 * Usage:
 *   /pi-setup            copy bundled files into place (backing up existing)
 *   /pi-setup --dry-run  preview what would change without writing
 *   /pi-setup --yes      skip the interactive confirm
 *
 * Files applied (source -> destination):
 *   settings.json     -> ~/.pi/agent/settings.json      (pi auto-installs `packages` next start)
 *   models-store.json -> ~/.pi/agent/models-store.json
 *   quotas.json       -> ~/.pi/agent/extensions/quotas.json
 *   skills-lock.json  -> ~/.agents/.skill-lock.json     (then: bunx skills experimental_install)
 *
 * Safety: existing destination files are backed up to <path>.bak-<timestamp>
 * before being overwritten. Nothing runs automatically on load.
 */

import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// Locate the bundled files relative to this module (installed package root).
const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(HERE, "..", "..");

interface Mapping {
  src: string;
  dest: string;
  label: string;
  tip?: string;
}

function buildMappings(): Mapping[] {
  const home = homedir();
  const agent = join(home, ".pi", "agent");
  const agents = join(home, ".agents");
  const extDir = join(agent, "extensions");
  return [
    {
      src: join(PKG_ROOT, "settings.json"),
      dest: join(agent, "settings.json"),
      label: "settings.json",
      tip: "pi auto-installs the `packages` list on next start",
    },
    {
      src: join(PKG_ROOT, "models-store.json"),
      dest: join(agent, "models-store.json"),
      label: "models-store.json (model catalog)",
    },
    {
      src: join(PKG_ROOT, "extensions", "quotas.json"),
      dest: join(extDir, "quotas.json"),
      label: "extensions/quotas.json",
    },
    {
      src: join(PKG_ROOT, "skills-lock.json"),
      dest: join(agents, ".skill-lock.json"),
      label: "skills-lock.json",
      tip: "then run `bunx skills experimental_install` to restore skills",
    },
  ];
}

export default function (pi: ExtensionAPI) {
  pi.registerCommand("pi-setup", {
    description: "Apply this package's bundled pi setup (settings, models, quotas, skills lockfile)",
    handler: async (args, ctx) => {
      const dryRun = /\-\-dry-run/.test(args ?? "");
      const yes = /\-\-yes/.test(args ?? "");
      const home = homedir();
      const mappings = buildMappings();

      // Validate bundled sources exist before doing anything.
      const missing = mappings.filter((m) => !existsSync(m.src));
      if (missing.length) {
        const names = missing.map((m) => m.src).join(", ");
        throw new Error(`pi-setup: bundled files missing (package not intact?): ${names}`);
      }

      // Compute planned changes.
      type Plan = { m: Mapping; currentExists: boolean; same: boolean; prev?: string };
      const plan: Plan[] = [];
      for (const m of mappings) {
        const currentExists = existsSync(m.dest);
        let same = false;
        let prev: string | undefined;
        if (currentExists) {
          prev = await readFile(m.dest, "utf8");
          const next = await readFile(m.src, "utf8");
          same = prev === next;
        }
        plan.push({ m, currentExists, same, prev });
      }

      const changed = plan.filter((p) => !p.same);
      const out: string[] = [];
      out.push("pi-setup plan:");
      for (const p of plan) {
        if (p.same) {
          out.push(`  [ok] ${p.m.label} — already up to date`);
        } else {
          out.push(
            `  [${dryRun ? "would write" : "write"}] ${p.m.label} -> ${p.m.dest}`,
          );
        }
      }
      if (!changed.length) {
        out.push("Nothing to change — setup already up to date.");
        return { content: [{ type: "text", text: out.join("\n") }], details: {} };
      }
      if (dryRun) {
        out.push("Dry run only — no files written. Run `/pi-setup` to apply.");
        return { content: [{ type: "text", text: out.join("\n") }], details: {} };
      }

      // Confirm before mutating (only when interactive UI is available).
      const ui = (ctx as { ui?: { confirm?: (...a: unknown[]) => Promise<boolean> } }).ui;
      const canConfirm = !yes && typeof ui?.confirm === "function";
      if (canConfirm && ui?.confirm) {
        const ok = await ui.confirm(
          "Apply pi-setup?",
          `${changed.length} file(s) will be copied into ~/.pi and ~/.agents (originals backed up).`,
        );
        if (!ok) {
          return { content: [{ type: "text", text: "pi-setup cancelled." }], details: {} };
        }
      }

      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      const results: string[] = [];
      for (const p of changed) {
        const { m } = p;
        mkdirSync(dirname(m.dest), { recursive: true });
        if (p.currentExists && p.prev !== undefined) {
          const backup = `${m.dest}.bak-${ts}`;
          await writeFile(backup, p.prev, "utf8");
          results.push(`  backed up ${m.dest} -> ${backup}`);
        }
        await copyFile(m.src, m.dest);
        results.push(`  wrote ${m.dest}${m.tip ? ` (${m.tip})` : ""}`);
      }

      return {
        content: [
          {
            type: "text",
            text:
              ["pi-setup applied:"].concat(results).concat([
                "",
                "Next: run `bunx skills experimental_install` to restore skills from the lockfile.",
                "Restart pi (or /reload) so it installs the `packages` and any other settings.",
              ]).join("\n"),
          },
        ],
        details: {},
      };
    },
  });
}