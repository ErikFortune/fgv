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
