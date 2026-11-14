# changelog-curation-5.1.0 — brief

**Base:** `sudoku-extraction` (#786, includes #785) merged with `integration/asks` (#784); `integration/asks` once #786 lands.
**Branch:** `changelog-curation-5-1-0`. Orchestrator-owned; record judgement calls in `state.md`.

**Why:** 5.1.0 is the first non-alpha release since 5.0.2 (`origin/main`). Rush renders every pending
file in `common/changes/` into the package's `CHANGELOG.md` at publish time, and that CHANGELOG ships
inside the npm tarball. Today there are ~760 pending change files, mostly stream-by-stream
implementation notes written for alpha consumers — noise for someone upgrading from 5.0.2. The
maintainer decided: **replace each package's pending change files with a few curated entries**
describing what 5.1.0 changes relative to 5.0.2, with breaking items called out. Detail stays in git
history and `docs/workstreams/`.

## Mechanics (verify, don't assume)

- Lockstep `base-utils` policy: every entry renders under `### Updates` for the package; `type` is
  inert at publish (see `.ai/instructions/ACTIVE_DEVELOPMENT.md` § "How to type a change file"). Type
  entries honestly anyway: `minor` for packages with additions, `patch` for fix-only, `none` for
  packages with nothing user-visible.
- Each entry's `comment` becomes one bullet. Keep each bullet one line-ish (≤ ~300 chars); a package
  gets roughly 3–10 bullets. Markdown inline code is fine.
- A package with **no** pending change file is still published at 5.1.0 with "_Version update
  only_". Every package that had pending files must end with at least one curated file.
- Before writing, confirm by reading Rush's changelog generation for lockstep (or a dry run on a
  scratch clone: `rush version --bump` then inspect a CHANGELOG.md, then discard) how multiple
  files render, so the curated set reads well. Never run anything with `--publish`.

## What to write, per package

**Packages new since 5.0.2** (absent from `origin/main` `libraries/`/`tools/`; check with
`git ls-tree origin/main`): one opening bullet "Initial release: <one-sentence what it is>", then
2–6 bullets on its main capabilities, drawn from the package's `CAPABILITIES.md` and README (not
from the change-file history — first-time readers don't need the path it took).

**Packages present in 5.0.2** (`ts-utils`, `ts-utils-jest`, `ts-json-base`, `ts-json`, `ts-bcp47`,
`ts-res`, `ts-res-ui-components`, `ts-extras`, `ts-web-extras`, and any `tools/` on main):
- 3–10 bullets on what is new or changed for a 5.0.2 user, grouped by theme, derived from the
  pending change files and the `etc/*.api.md` diff against `origin/main`.
- Then, where applicable, bullets prefixed **`Upgrading from 5.0.2:`** for every caveat below.
  These are the semver-audit findings (2026-11-14) and must all appear, worded for a consumer:
  - `ts-utils`: `Converter` and `Validator` gained a required `or()`; `IResult` gained required
    `orDefaultWith`, `shouldNotFail`, `thenOnSuccess`, `thenOnFailure` — affects only code that
    implements these interfaces by hand instead of extending `BaseConverter`/`GenericValidator` or
    using `succeed`/`fail`. Also note the behaviour fixes: `mapSuccess` now matches its documented
    contract; `strictObject` no longer throws on null-prototype objects; Node ESM `import` now
    resolves (it failed with `ERR_UNSUPPORTED_DIR_IMPORT` in 5.0.2).
  - `ts-res`: `ResourceJson.Json.ConditionSetDeclAsRecord` is now readonly and partial — code that
    builds one by assigning keys one at a time must build a `Record<string, …>` and assign it whole;
    `QualifierCollector`'s protected constructor changed (subclasses calling `super(params)`).
  - `ts-web-extras`: now requires the peer `@fgv/ts-extras` (install `@fgv/ts-extras@^5.1.0`;
    npm 7+ installs peers automatically); `FileApiTreeAccessors` dropped an unused type parameter
    (drop the type argument); `BrowserHashProvider` is also available as
    `CryptoUtils.BrowserHashProvider`.
  - `ts-utils-jest`: runtime dependencies moved to Jest 30; verified working under Jest 29 for the
    Result matchers and snapshot matchers.
  - `ts-bcp47`: now dual-published (ESM for bundlers, CJS for Node) — no API change.
  - `ts-extras`: new runtime dependencies `js-yaml` and `luxon` types; everything marked breaking in
    alpha change files is on surfaces that did not exist in 5.0.2 (`ai-assist`, crypto, KeyStore,
    Mustache) — do not carry those "BREAKING" notes into the 5.1.0 changelog.
  - tools `ts-res-browser`, `ts-res-browser-cli`: Node 22.22.0 or later required (Node 20 dropped).
- Do **not** carry alpha-era `BREAKING:` notes about surfaces that never shipped in 5.0.2; for a 5.0.2
  user those surfaces are simply new. Verify each claim of "existed in 5.0.2" with
  `git show origin/main:<path>` or `etc/*.api.md` on main.

## Output

- Delete every pending file under `common/changes/@fgv/*/` (and any other scope present), then add
  one curated file per entry: `common/changes/@fgv/<pkg>/release-5-1-0-<nn>_2026-11-14-00-00.json`
  in Rush's standard shape (`changes: [{packageName, comment, type}]`, `packageName`, `email`).
- `RELEASE-NOTES-5.1.0.md` is **not** wanted; the curated changelogs are the release notes.
- `result.md` must contain the full rendered text, package by package, exactly as it will appear —
  this is what the maintainer reviews in the morning.
- `rush change --verify --target-branch origin/integration/asks` must pass (no code is touched, so
  no rebuild/test gate is needed). Prettier on touched `.md`.

## Process

- No subagents. Run everything in the foreground; nothing left running. Logs under
  `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/changelog/`.
- Close out per `finalize-task` into `.ai/tasks/completed/2026-11/changelog-curation-5-1-0/`
  (headline `''`), ledger entry, PR `#TBD`. Add only your own ledger entry and index id.
- Push your branch. Never force-push, rebase, delete branches, open a PR, or touch other branches.
- Report: head SHA, count of files deleted/added per package, and the path to `result.md`.
