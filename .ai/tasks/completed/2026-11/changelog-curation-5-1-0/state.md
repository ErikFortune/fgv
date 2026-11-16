# changelog-curation-5.1.0 — state

Worker-owned. Judgement calls and evidence; the outcome is in `result.md`.

## Method

1. Dumped every pending comment per package (760 files, 36 projects) and read them.
2. Diffed each 5.0.2 package's `etc/*.api.md` and `package.json` (deps, peers, engines, exports)
   against `origin/main`.
3. Downloaded the **published 5.0.2 tarballs** from npm for the twelve packages present on main and
   checked the packaging claims against what actually shipped: LICENSE, source maps, test files,
   `dist/` presence. Reproduced the 5.0.2 ESM failure (`import` of `@fgv/ts-utils@5.0.2` →
   `ERR_UNSUPPORTED_DIR_IMPORT`) and the CRLF shebang in `ts-res-cli@5.0.2`'s bin.
4. New packages: bullets drawn from `CAPABILITIES.md`, README, package description and the api.md
   export lists, not from the change-file history.
5. Generated the curated set with a script (scratchpad `changelog/gen.js` + `entries.js`), rendered
   it on a throwaway clone with the exact release sequence, and copied the rendered sections into
   `result.md`.

## Judgement calls

### J1 — `type` is not inert; types chosen per entry

The brief's mechanics note (and `ACTIVE_DEVELOPMENT.md` § "How to type a change file") says
lockstep entries all render under `### Updates`. Verified false on a scratch clone, confirmed by
the orchestrator mid-stream:

- `rush version --bump` renders by type: `major` → `### Breaking changes`, `minor` →
  `### Minor changes`, `patch` → `### Patches`, `none` → `### Updates`, in that order.
- `rush publish --apply` (no `--include-all`) goes further and **bumps per package by type**: on the
  pre-curation set it produced 5.2.0 for `minor` packages, 5.1.1 for `patch`-only ones and 5.1.0
  for `none`-only ones — lockstep broken. Recorded for the publish-workflow stream.
- The release sequence the orchestrator named —
  `rush version --ensure-version-policy --version-policy base-utils --override-version 5.1.0-0`
  then `rush version --bump --version-policy base-utils --override-bump patch` — yields **5.1.0 for
  every published project with this curated set, including the `major` entries**, and consumes all
  change files. Verified.

Per the orchestrator's update: features → `minor`, fixes / packaging / dependency updates →
`patch`. `Upgrading from 5.0.2:` caveats that break code which compiled against 5.0.2 → `major`
(the repo rule: `major` means "breaks code that shipped non-alpha", and these surfaces are on
`main`). Caveats that break nothing (ts-bcp47 dual publish, ts-utils-jest Jest 30 deps, ts-extras
new deps, `BrowserHashProvider` alias) → `none`, which renders last under `### Updates`. The two
ts-utils behaviour-fix caveats (mapSuccess/strictObject, Node ESM) → `patch`.

The consequence for reading: within a package, bullets group by heading, so the "Upgrading" notes
are not all in one place — breaking ones lead, informational ones trail. That is the rendering the
`type`s produce; the per-entry numbering only orders bullets within a heading.

### J2 — unpublished projects get no curated file

`@fgv/ks`, `@fgv/testbed`, `@fgv/ts-res-tutorial` and `@fgv/ts-res-ui-playground` have
`shouldPublish: false`. Neither `rush version` nor `rush publish` consumes their change files (the
pre-curation dry run left all 20 behind), `rush change --verify` does not require them, and they
never render into a shipped changelog. Their 20 files are deleted with the rest and none are added;
a curated file there would sit in `common/changes/` forever. This departs from the brief's "every
package that had pending files must end with at least one curated file", whose purpose (no
published package rendering as "_Version update only_") these four do not touch.

### J3 — `heft-dual-rig` and `typedoc-compact-theme` are not quite "initial"

Both were published once on 2026-03-24 outside the lockstep line (`0.1.0` and `1.0.0`, still the
npm `latest`). Worded "First release on the 5.x lockstep line (previously published separately as
…)" rather than "Initial release". `heft-dual-rig` is on main but `private`.

### J4 — claims dropped because 5.0.2 did not have the defect

Alpha-era fixes for regressions introduced after 5.0.2 are not carried: the ts-res `config` packlet
omission (present in the 5.0.2 tarball), the ts-bcp47 browser-entry `fs` leak (the 5.0.2 iana
barrel did not re-export the loader), and "ships LICENSE" for packages whose 5.0.2 tarball already
had one (ts-utils, ts-utils-jest, ts-json-base, ts-json, ts-bcp47, ts-res, ts-extras).

### J5 — facts about the brief's premises

- Most 5.0.2-line packages ship `CHANGELOG.json`, not `CHANGELOG.md` (`.npmignore` drops `*.md`
  except README/CAPABILITIES; ts-res allows CHANGELOG.md). The curated text still reaches npm via
  the `.json`. Orchestrator confirmed.
- `publish-release-impl.yml` runs `rush publish --publish --include-all` with no `--apply`; the
  `--include-all` path never applies change files or writes changelogs. Already an open item in
  `.ai/notes/orchestrator/branch-migration-checklist.md` § Automated publish step 3.
- A dry run of `rush publish --apply` without `--publish` still **executes** `git checkout -b`,
  `git commit` and `git push origin` — only npm publish and tags are dry-run. Run it only on a
  clone whose origin is a scratch bare repo.

### J6 — antagonist pass over the new-package bullets

Each capability bullet for a new package was re-checked against the package's exports, not its
README. One overclaim was found and fixed: `@fgv/ts-app-shell`'s README lists a "Command Palette",
but the package exports only a keyboard-shortcut registry (`KeyboardShortcutRegistry`,
`useKeyboardShortcuts`) whose docs mention a palette as a use; the bullet now names the registry.
The README itself is left as is (out of scope; noted here). Also re-checked and unchanged: the
`mutable` option on filesystem and in-memory trees (`fsTree.ts` honours it), `chatStructured`
taking a `JsonSchema.ISchemaValidator<T>`, `MessageLogLevel` / `ReporterLogLevel` existing on main
(only their value lists and converters are new), `summarize` on both transformers packages, and
every packaging claim against the 5.0.2 and 5.1.0-62 tarballs.

## Open questions

- `@fgv/ts-app-shell`'s README advertises a command palette the package does not ship (J6).
- `ACTIVE_DEVELOPMENT.md` § "How to type a change file" is wrong about `type` being inert; the
  orchestrator says another stream will correct it. Not edited here.
