# State — `agent-tasks-t1`

Newest entry last. Append one at each phase boundary.

---

## 2026-09-22 — phase 0: required reading complete, scope confirmed

**Verified against the tree.** Every required-reading file exists.
`implementation-plan.md` § T1 says what the kickoff says it says — deliverables,
acceptance (five), tests and review gate all match, including the A3 sentence
"Count/byte schemas must make maximum completion and settlement charges computable
before acceptance." `development-design.md` §8.6 exists and is the capacity authority.
F1/F2 are shipped (`af05bb319` on this branch's base). No missing-input escalation.

**Branch:** `claude/agent-tasks-t1`, based on `integration/agent-tasks-v1` at `af05bb319`.
PRs target the integration branch; change-file verification targets it too.

### Slice boundary as I am drawing it

T1 ships two packlets — `types` and `converters` — plus the package scaffold. In scope,
from design §4/§5/§8.6:

- brands, `ITaskScope` / `IResponsibility` / `ITaskReference`, reasons, progress, outcome
- `TaskLifecycle`, `ObservationHealth`, `RecoveryDeclaration`, `ISourceBinding`
- `ITaskEnvelope` / `ITaskSnapshot`, `ITaskFailure` / `ICapacityFailure` / `TaskResult`
- command values: `ICommandRequest`, `CommandState`, `ICommandReceipt`, `ITaskCommandDescriptor`
- source *value* unions only: `ISourceRevision`, `ISourceProjection`, `SourceRead`, `RecoveryResult`
- kind + command registries with converter-closure erasure; typed handles
- built-ins `fgv.tracked@1`, `fgv.task-list@1`
- A3: capacity profile/limits/bounds, `ICapacityStatus`, discriminated `capacityClaims`,
  source-replay declaration
- injected `ILogger` / `clock` / `newId` environment, Result-valued factories

Deliberately **not** in T1, though adjacent in the same design sections:

- `ITaskSource` and `ISourceCapabilities` — the source *interface* is T6.
- `ITaskSummary`, `ITaskUpdate`, `UpdateCategory`, commit records — storage, T3.
- `ITaskRepository` / writer / query / paging / bound views — T3/T4/T5.
- stop intents and results — T9.

### Open items carried into implementation

1. **Source history vocabulary is spelled two ways in the design.** §5's
   `ITaskSource.history` is `'latest-snapshot' | 'replayable-updates'`; §1 and §8.6 say
   `'observed-state'` and `'source-replay'` for the same distinction. T1 must pick one
   because the source-replay declaration keys off it. Proceeding with the §8.6 spelling
   (`observed-state` / `source-replay`) since A3 is the authority for the declaration, and
   recording it for T6 to confirm or revise.
2. The §8.3/T6/T8 executor-payload-dereference question does not reach any T1 type.
   `ITaskReference` stays opaque and carries no dereference permission. Nothing to surface.

---

## 2026-09-22 — phase 1: T1 implemented, gates green

**Shipped.** `libraries/ts-agent-tasks` exists with its `types` and `converters` packlets, a
`CAPABILITIES.md`, a router row and a change file. 366 tests, 100% on all four coverage metrics.

**Verified.**

| gate | result |
|---|---|
| `rushx build` | clean, **zero warnings**, API report checked in |
| `rushx lint` | clean; `rushx fixlint` run |
| `rushx test` | 366 passed, 100% statements/branches/functions/lines |
| `rush rebuild` (repo-wide) | green — a new Rush project changes the build graph |
| `rush change --verify --target-branch origin/integration/agent-tasks-v1` | change file found |
| `verify-capability-docs.mjs` | 24/24 libraries documented, router 19,158/24,000 |
| `verify-esm-entrypoints.mjs` | 24 checked, 0 failed |
| `verify-bundler-resolution.mjs` | 20 checked, 0 failed |
| `verify-tarball-exports.mjs` | 26 packages, 205 manifest paths, 0 failed |

**Layer-1 review run and its findings resolved.** No P1. Three P2 and three P3; what changed is in
`result.md` § *Review*. The load-bearing one: the reviewer called `SourceRead` gold-plating, and it
was — it is `ITaskSource.observe`'s return type and no T1 gate names it. Cut. `RecoveryResult` and
the `ISourceProjection` / `ISourceRevision` it requires stay, because the plan's gate-2 row names
"explicit reattach/resumable/unrecoverable/unavailable recovery" and lists T1 among its slices.

**Open, carried forward.**

1. The source-history spelling remains unified on §8.6's `observed-state` / `source-replay`. §5's
   `ITaskSource.history` says `latest-snapshot` / `replayable-updates` for the same distinction.
   T6 confirms or revises; nothing in T1 depends on which wins.
2. An upstream observation, **not folded in** per the brief: `Converters.strictObject(...).convert()`
   **throws** on a null-prototype object rather than returning a failure, because `ts-utils`'
   `isKeyOf` calls `item.hasOwnProperty(key)` instead of `Object.prototype.hasOwnProperty.call`.
   `JSON.parse` never produces such an object, so wire data does not reach it; a host that hands a
   converter an `Object.create(null)` value does. Escalated, not fixed.
3. `rushx coverage` (the `jest --coverage` script) fails with a babel-parser error on every TS test
   file — reproduced on the already-shipped `ts-prompt-assist`, so it is pre-existing tooling, not
   this package. `rushx test` carries the coverage gate and is green.
