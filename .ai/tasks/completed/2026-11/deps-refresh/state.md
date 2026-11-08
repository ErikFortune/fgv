# State: `deps-refresh`

Worker-owned. The brief is frozen; questions and decisions live here.

## Progress
- [x] Baseline `rush install` (Rush 5.177.2, pnpm 11.12.0) — clean.
- [x] Baseline audit — `rush-pnpm audit --json` (CLI worked; bulk endpoint not needed for the
      lockfile audit). 173 advisories: 4 critical, 73 high, 84 moderate, 12 low.
- [x] Toolchain: Rush 5.182.1 / pnpm 11.28.9 (`aeb5a83a`)
- [x] Security fixes — `rush update --full`, 6 direct bumps, 2 overrides (`aeb5a83a`); audit 173 → 4
- [x] Minor/patch refresh (`5ef14173`); Heft family held after rebuild failure (`cbe61f9d`)
- [ ] Clean `rush install` (release-age check)
- [ ] Gates: rebuild, lint, test, change --verify, prettier, capability docs/feed
- [ ] Close-out

## Findings / decisions
1. **`globalOverrides` is silently ignored on the baseline toolchain.** Rush 5.177.2 writes
   `globalOverrides` into the generated `common/temp/package.json` `pnpm` field, which pnpm 11 no
   longer reads (`rush-pnpm` prints `The "pnpm" field in package.json is no longer read by pnpm`).
   Rush 5.178.0's changelog: "Fix pnpm 11 silently ignoring the `globalOverrides` … Rush now writes
   these settings to the generated `common/temp/pnpm-workspace.yaml` for pnpm 11+". So the Rush
   bump is a precondition for any override in this stream, not just a refresh. Rush 5.177.2 →
   5.182.1 (minor, published 2026-10-30).
2. **pnpm** 11.12.0 → 11.28.9 (`latest-11` dist-tag, published 2026-10-27). 12.x is a major and
   is reported, not taken. `next-11` (11.28.11) is skipped because it is not the `latest-11` tag.
   Neither pnpm nor `@microsoft/rush` has an advisory at either version (bulk advisory endpoint,
   queried 2026-11-08).
3. **Precedent.** The previous dependency upgrade (Jest 30 / Heft 1.3, #674, commit `2d43e3bd`) has
   no task directory under `.ai/tasks/completed/`; its method and pitfalls are in its commit
   message (toThrowError removal, new native build scripts needing `globalAllowBuilds`, jsdom
   behaviour changes, release-age rejection at CI install per CODING_STANDARDS).
4. **Heft family held** (`cbe61f9d`). Taking the latest rigs failed `rush rebuild`
   (`scratchpad/deps/rebuild.log`): heft-lint-plugin 1.3.0 lints non-TS files, so override blocks
   naming `@rushstack/packlets/mechanics` without `files` became config errors; eslint-config 4.9.0
   adds `@rushstack/prefer-ecmascript-private-members: 'warn'`. The plugins pin `@rushstack/heft`
   exactly (`ERR_PNPM_PEER_DEP_ISSUES`, `update-5.log`), so heft and every heft plugin/rig are back
   at their base pins; eslint-config moved 4.6.4 → 4.7.0 only (the version the rigs already used).
   Fixing forward would mean ≈34 config edits plus a repo-wide `#private` migration or a rule
   disposition — both beyond "source changes a bump requires", and the second is a design call.
5. **Held by package policy:** `re2js` 2.9.1 (dialect-table review; upstream changelog not
   reachable — GitHub access to `le0pard/re2js` not enabled in this session) and
   `@typesafe-ai/sdk` 0.7.0.
6. **`@testing-library/jest-dom` `~6.9.1`**, not `^6.x`: 6.10.0 is deprecated upstream as a
   breaking minor.
7. **MCP SDK 1.32 redirect default** broke one `ts-extras-mcp` test control in the first repo-wide
   `rush test` (`test.log`). Not a flake: it appears only after the bump, and the SDK source shows
   the new `redirectPolicy: 'same-origin'` default. Control, TSDoc and README updated
   (`67171b4a`); see result § 6.
8. **`rush add` side effects corrected:** it rewrote `common-versions.json` and dropped every
   comment plus the empty `allowedAlternativeVersions` block; restored from base with only the two
   `@simplewebauthn/*` preferred versions raised. It also dropped one empty `"dependencies": {}`.
9. **Orchestrator note:** the finalize-task skill says not to commit a ledger entry unreviewed;
   the brief asks for one. Written with `#TBD` for orchestrator review.
