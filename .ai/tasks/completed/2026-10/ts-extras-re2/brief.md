# Brief: `ts-extras-re2` — an RE2-backed `patternValidator` for untrusted JSON Schema `pattern`

Orchestrator-owned; frozen at kickoff. Put questions in `state.md`.

**Origin:** user decisions 1 and 3, 2026-10-18 and 2026-10-19. #742 shipped `fromJson(json, { patternValidator })` and `adaptMcpTools({ patternValidator })`, both of which refuse `pattern` without a validator. This stream provides the default validator. **Base / PR target:** `integration/asks`.

**Read first:**
- the #742 `result.md` (`.ai/tasks/completed/2026-10/json-schema-pattern/`);
- the `SchemaPatternValidator` type and its TSDoc in `ts-json-base`;
- `libraries/ts-extras-argon2/` as the package template: layout, CAPABILITIES, how it wraps a third-party engine behind an fgv interface, and its dependency posture;
- `.ai/conventions/result-integration-boundary.md`.

## Decisions

1. **New package `@fgv/ts-extras-re2`** in `libraries/`, registered in `rush.json` and on the lockstep version policy. Follow the `ts-extras-argon2` template.
2. **Engine: `re2js`** (pure-JS RE2 port; linear time; no native build; Node and browser). Before adding it:
   - check its latest version's publish age against the repo's minimum release age;
   - check licence (must be permissive);
   - check maintenance and transitive dependencies.

   Record all of it in `result.md`. If any check fails, **stop and report**. Do not substitute a different engine without asking. Add it with `rush add -p re2js` (exact version), never by hand-editing `package.json`.
3. **Export** `re2PatternValidator: SchemaPatternValidator` (name it to fit the package; justify in `state.md`).
   - It compiles the source with re2js, and returns `fail` with a clear message on a compile error or an unsupported construct. RE2 has no lookaround and no backreferences, so those are refused, which is the safe direction.
   - It returns a predicate with **unanchored** semantics, i.e. JSON Schema `pattern` search, not full match.
   - It never throws: wrap the engine in `captureResult`, and make the predicate fail closed (return false, or the documented failure path).
   - Unicode semantics should match ECMA `u` as closely as RE2 allows. Document the known dialect differences: `\d`/`\w` Unicode classes, `\p{…}` support, and named-group syntax.
4. **Optional limits.** Allow an options variant, e.g. `createRe2PatternValidator({ maxSourceLength?, maxProgramSize? })`, if re2js exposes program size. The default must be safe for untrusted input. RE2 is already linear, so the main remaining risk is a huge source; bound it.
5. **Tests.**
   - Catastrophic-backtracking classics such as `(a+)+$` and `(.*a){20}` on long inputs complete quickly. Assert by operation, not wall clock: see `deterministic-timing-tests`. Prove the input is long and the predicate returns.
   - Unsupported constructs are refused.
   - Unanchored semantics: `abc` matches `xxabcxx`.
   - `^…$` anchoring works.
   - Unicode cases.
   - An end-to-end `fromJson(schema, { patternValidator: re2PatternValidator })` test, and an `adaptMcpTools` test in a test file of this package. Do not add a dependency from `ts-json-base` or `ts-extras-mcp` onto this package.
6. **Docs.**
   - The new package's `README.md` and `CAPABILITIES.md`.
   - A `LIBRARY_CAPABILITIES.md` package-table row plus a decision shortcut ("Accepting untrusted JSON Schema `pattern`?" → `re2PatternValidator` · `ts-extras-re2`), within the router size gate.
   - Cross-references from `ts-json-base` and `ts-extras-mcp` CAPABILITIES, as code spans and not `{@link}`.
   - `docs/FUTURE.md`: mark the RE2 item shipped.

## Acceptance

- [ ] Gates:
  - the new package's build, lint and test at 100%;
  - repo-wide `install`, `rebuild` and `test`. The lockfile changes, so `install` must pass under the release-age policy;
  - `change --verify --target-branch origin/integration/asks` (new package change file `minor`);
  - `verify-capability-docs`;
  - `generate-capability-feed --check`;
  - prettier 2.8.
- [ ] api.md is clean, with no new `ae-*` warnings in the new package beyond the sanctioned `inheritDoc` pattern.
- [ ] Close-out: migrate the task folder, `meta.yaml`, `README`, ledger (`#TBD`), feed.

## Mechanics

Own worktree. Push only to `ts-extras-re2`; no PR. A `web-fetch` sub-agent is allowed for package metadata or docs; no other sub-agents. Commit before gates; run gates in the foreground with per-worktree logs.
