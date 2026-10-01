# agent-tasks-t1 — package, values, converters and registry

**Shipped**: 2026-09-22 via [PR #684](https://github.com/ErikFortune/fgv/pull/684) into `integration/agent-tasks-v1` (finalized at the agent-tasks cluster close, 2026-10-01).

## Summary

T1 created `@fgv/ts-agent-tasks` — the vocabulary the rest of the library is written in. It shipped
two packlets, `types` and `converters`, registered under the `base-utils` lockstep policy, with no
storage, no broker and no side effects at import. The slice's characteristic artifact is the
**declared-vs-exercised table** in `result.md`: every closed set T1 declared is shape-exercised by
converter tests, but roughly half are *choice*-unexercised predictions about later slices, which is
why the work landed on an integration branch where a revision costs a diff. Later slices (T2–T5)
annotated that table in place as they exercised or revised members. 409 tests, 100% on all four
coverage metrics, no coverage directives.

## Files changed

- `libraries/ts-agent-tasks/` (new): scaffold (`package.json`, `config/`, `eslint.config.js`,
  `tsconfig.json`, `README.md`, `LICENSE`, `CAPABILITIES.md`, `etc/ts-agent-tasks.api.md`).
- `src/packlets/types/` — `ids`, `common`, `lifecycle`, `source`, `envelope`, `failure`,
  `commands`, `updates`, `bounds`, `capacity`, `capacityProfile`, `registry`, `builtins`,
  `environment`.
- `src/packlets/converters/` — `primitives`, `identityConverters`, `valueConverters`,
  `envelopeConverters`, `failureConverters`, `commandConverters`, `capacityConverters`,
  `kindRegistry`, `builtinKinds`, `taskConverters`, `taskEnvironment`.
- Tests under `src/test/unit/` (converters, types, `publicSurface.test.ts`).
- `rush.json`, `common/config/rush/pnpm-lock.yaml`, change file, `docs/WORKSTREAMS.md`, two status
  lines in `docs/design/agent-tasks/implementation-plan.md`.

## Decisions made during execution

- **`SourceRead` cut; `RecoveryResult`, `ISourceProjection`, `ISourceRevision` kept.** Layer 1 called
  all four gold-plating. `SourceRead` had no T1 consumer and no gate naming it; the other three stay
  because the plan's gate-2 row lists T1 among the slices for explicit recovery results, and
  `RecoveryResult` structurally requires the other two.
- **Deliberately not declared:** a `PageCursor` converter (T4's encoding), `ITaskSource` /
  `ISourceCapabilities` (T6), `ITaskUpdate` / `ITaskSummary` / commit records (storage), and tracked
  command parameter schemas — eleven names, zero schemas. Only `UpdateCategory` was pulled forward,
  because closeout charges must be computable.
- **`maximumClosureCharges` / `maximumSettlementCharges` became `Result`-valued** (Copilot round 1):
  unchecked arithmetic made the advertised maximum silently inexact for large encoded bounds.
- **The profile converter enforces the protected bundles** (Copilot round 3, summary-only): a
  profile that could not finish work it accepted was rejected. `result.md` calls this "the deepest
  finding of the whole loop".
- **`perOwner` binds `maxAudiencePerUpdate` to `bounds.maxReferences`** in both directions
  (Copilot round 4 + CodeRabbit), so capacity is never reserved for a claim that cannot be encoded.
- **Source-history spelling unified on §8.6** (`observed-state` / `source-replay`), recorded for T6.
- **`TaskKindRegistry.create()` kept `Result`-valued** although vacuous today, for family
  consistency.
- **CodeRabbit docstring-coverage warning dispositioned**: every exported symbol is documented; the
  shortfall is inline callbacks.

## Followups

| item (from `result.md` § *Things a later slice must decide*) | where it went |
|---|---|
| Source-history spelling | Confirmed by T6 — `docs/design/agent-tasks/development-design.md` § *Source-history spelling (confirmed by T6, 2026-09-24)* |
| Closeout/settlement arithmetic is T1's derivation | Exercised and revised by T3 (`first-resolution` purpose, shrinking charges); see `agent-tasks-t3` |
| Capacity limits are unmeasured defaults | M1 (T4 early run, `agent-tasks-t8b`, `agent-tasks-m1-stop`); the plan's § 8 records the profile decision as still open in `docs/TECH_DEBT.md` |
| Per-owner vs repository-wide limit structures — "T3's call" | **No explicit disposition found** in `agent-tasks-t3/result.md` |
| Per-record-type byte ceilings vs one `record-bytes` dimension | Applied per record by T3 (`recordLimitFor`) |
| `ts-utils` `isKeyOf` null-prototype throw | Fixed by `null-prototype-property-guard` (#700, 2026-09-27) |
| Executor-payload dereference (§8.3 / T6 / T8) | Did not reach T1 |
| `rushx coverage` babel-parser failure (pre-existing tooling) | **Recorded nowhere durable** — not in `docs/TECH_DEBT.md` |

## Lessons codified during the run

- **A bounded array whose entries carry an identity needs a uniqueness constraint, not just a length
  cap** — hit for charges, status rows, claim collections and claim audiences. Carried forward as
  trap #1 in the T2 and T3 briefs.
- **A Copilot round that posts zero comments is not evidence of a clean diff**: round 3 posted
  `Findings: None` while its summary's "Previously missed" block held real defects. Carried into the
  T2/T3 briefs.
- **A test that pins one constant against another looks like a guard and is not** (the round-4 test
  covered only the default profile; CodeRabbit found the custom-profile hole).
- **Read `.github/workflows/ci.yml` and run every step it runs** — `generate-capability-feed.mjs
  --check` failed the first two pushes because a new package ships empty feed markers. The nine-step
  list is in `result.md` § *Gate results*; T2's and T3's briefs cite it.

## References

- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md` (carries later-slice annotations in its declared-vs-exercised table)
- PR: [#684](https://github.com/ErikFortune/fgv/pull/684)
