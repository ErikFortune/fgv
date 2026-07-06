# Findings — `@fgv/heft-dual-rig` coverage-threshold gate fix

## Summary

`rushx test` / `rush test` (via `@fgv/heft-dual-rig` → `@rushstack/heft-jest-plugin`)
printed the Jest coverage-threshold warning but **exited 0**, so the repo's
"100% coverage to merge" rule was never enforced by an exit code. Fixed at the
rig layer with a Jest `testResultsProcessor` hook. A coverage-threshold miss now
exits non-zero, identically to a failing test.

## Reproduction (baseline, before fix)

Package: `libraries/ts-utils`. Set `coverageThreshold.global.statements: 101` in
`config/jest.config.json`, then `rushx test` (exit code read directly, not through a pipe):

```
Jest: "global" coverage threshold for statements (101%) not met: 99.2%
REAL EXIT CODE: 0
```

Warning printed, exit 0 → gate unenforced. Confirmed.

## Root cause layer: upstream plugin behavior, remediated in the rig

`@rushstack/heft-jest-plugin@1.2.7` (`JestPlugin.js`) inspects `runCLI()`'s
returned `results` and only calls `logger.emitError(...)` (which fails the Heft
task) when `results.numFailedTests > 0` or `results.numFailedTestSuites > 0`:

```js
const { globalConfig, results: jestResults } = await runCLI(jestArgv, [buildFolderPath]);
if (jestResults.numFailedTests > 0) { logger.emitError(...); }
else if (jestResults.numFailedTestSuites > 0) { logger.emitError(...); }
```

Jest reflects a coverage-**threshold** failure in `results.success === false`
(the `CoverageReporter._checkThreshold` → `_setError` path flips `success` in
`TestScheduler`), but it does **not** increment the failed-test/suite counters.
The plugin therefore never sees the failure and exits 0.

There is no plugin option to enforce coverage (its options schema only exposes
`configurationPath`, `disableConfigurationModuleResolution`,
`enableNodeEnvManagement`), and per-package edits do not scale. Rather than fork
the upstream plugin, the fix uses a Jest-native, rig-owned hook.

## Fix applied (rig layer)

Jest calls `testResultsProcessor(results)` from `processResults()` **after**
`results.success` is finalized, and the plugin reads back exactly the object the
processor returns (`runJest` → `processResults` → `onComplete(runResults)` →
`runCLI` return). `$.testResultsProcessor` is already in the plugin's module-path
resolution list, so a rig-relative module reference resolves correctly.

New rig files:

- `rigs/heft-dual-rig/profiles/default/config/coverageResultsProcessor.js` — the
  hook. When jest deems the run a failure (`success === false`) but no test or
  suite failure was recorded (`numFailedTests === 0 && numFailedTestSuites === 0`
  — i.e. the failure is a coverage-threshold miss), it bumps `numFailedTestSuites`
  so the plugin's existing check fires and fails the task. Restores the
  `results.success` semantics the plugin drops. Pure CommonJS (rig has no build).
- `rigs/heft-dual-rig/profiles/default/config/jest.config.json` — extends the
  node-rig shared jest config (preserving all existing behavior) and adds
  `testResultsProcessor: "<packageDir:@fgv/heft-dual-rig>/profiles/default/config/coverageResultsProcessor.js"`.

Consumer wiring: each library's `config/jest.config.json` now `extends`
`@fgv/heft-dual-rig/.../jest.config.json` instead of the node-rig file directly
(one-line change × 21 packages). The dual-rig config still extends node-rig, so
current behavior is unchanged except for the added enforcement. Future packages
that extend the rig inherit the gate for free.

## Verification (after fix)

- `ts-utils` at its declared threshold (98): **exit 0**, no warning — no false positive.
- `ts-utils` with `statements: 101` probe: **exit 1**, plus
  `Jest: "global" coverage threshold for statements (101%) not met: 99.2%` and
  `[test:jest] Error: 1 Jest test suite failed` / `Exit code: 1`.

## Full-suite result (post-fix)

`rush test` halts on dependency order at an **environmental** failure in
`ts-json-base` (`mutableFsTree.test.ts` "returns permission-denied for read-only
file" — the sandbox runs as uid 0, so `chmod 0o444` is ignored by root and the
write-access probe returns writable). This is pre-existing and unrelated to the
coverage gate (0 coverage warnings). It blocked 25 downstream packages, so each
migrated library was run individually after a full `rush build`.

Per-package results (21 migrated node-rig libraries):

- **20 pass** at their declared thresholds (exit 0, no coverage warning):
  ts-utils, ts-utils-jest, ts-json, ts-bcp47, ts-extras, ts-extras-argon2,
  ts-extras-mcp, ts-extras-ollama, ts-extras-webauthn, ts-extras-transformers,
  ts-web-extras, ts-web-extras-argon2, ts-web-extras-webauthn,
  ts-web-extras-transformers, ts-app-shell, ts-agent-memory, ts-prompt-assist,
  ts-res, ts-sudoku-lib. (ts-json-base's coverage passes; its only failure is the
  environmental root test above.)

- **1 genuinely flagged by the now-live gate — `ts-random`** (declares 100% on
  all four metrics; actual):

  | metric | declared | actual |
  |---|---|---|
  | statements | 100 | **20.32%** |
  | lines | 100 | **20.32%** |
  | functions | 100 | **66.66%** |
  | branches | 100 | **81.39%** |

  Cause: the `src/generator` packlet is fully covered (100%), but the entire
  `src/generator-data` packlet (word lists — adjectives, animals, cities,
  colors, countries, domains, gerunds, jobs, names, …, plus `charClasses.ts`)
  and `src/index.ts` are **0% covered** and not excluded via
  `coveragePathIgnorePatterns`. Tests pass (127 tests); the code is simply
  untested/uncollected. This is real, previously-invisible debt surfaced by the
  now-enforced gate.

Per the brief, this was **not** papered over — no threshold lowered, no
`c8 ignore` added. The disposition for `ts-random` (add tests for the data
packlet, exclude the data files from collection, or accept an explicit justified
threshold) is a separate decision for the orchestrator, not part of this fix.

## Scope boundary (not covered by this fix)

- **Web-rig packages** `ts-res-ui-components` and `ts-sudoku-ui` extend
  `@rushstack/heft-web-rig` (not the dual-rig) and were **not** migrated — they
  retain the unenforced behavior. Enforcing them needs either the same
  `testResultsProcessor` field added to their configs (they'd need a devDependency
  on the rig) or a parallel web profile. `ts-sudoku-ui` is out of scope
  (slated to move to its own monorepo); `ts-res-ui-components` is a candidate for
  a follow-up. Flagged for the orchestrator.
- **Tools** (`ks`, `ts-res-cli`, `ts-res-browser`, …) are not dual-rig consumers
  (`ks` uses the `ts-jest` preset directly with no coverage gate; the `ts-res-*`
  tools use `@rushstack/rig`). Out of scope for this rig fix.
