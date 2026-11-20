# Stream brief — `agent-tasks-i1b`

**Slice I1b of four** — the mutation opt-ins, disabled by default.
`docs/design/agent-tasks/implementation-plan.md` § I1.

## Mission

Extend the `tools` packlet with **tracked-task and reassignment mutation tools**, available only when
the host explicitly opts in. Default construction must keep producing exactly I1a's two read-only
tools.

**Dependencies:** I1a (landed). **You do not need T9 or I1c**, and you must not reach for them —
`inspectStop` / `requestStop` / `releaseStop` / `reconcileStop` are I1d's, and generated command
tools are I1c's.

## Branch and PR posture

- **Branch:** `claude/agent-tasks-i1b`, cut off `integration/agent-tasks-v1` at the I1a landing.
- **PR into `integration/agent-tasks-v1`** — **not `release`.**
- **Artifacts in `.ai/tasks/active/agent-tasks-i1b/`.** This family finalizes at **cluster close**,
  not per slice. Do **not** run `/finalize-task`.

---

## What I1a left you, deliberately

I1a shipped `createTaskTools({ view, renderer?, budget? })` → exactly `task_query` and
`task_inspect`, over an `IBoundTaskView`. It added **no selection parameter of any kind**, on
purpose: the opt-in shape is yours to decide without inheriting one. Read
`.ai/tasks/active/agent-tasks-i1a/result.md` § *Routed beyond this slice* before you design it.

Three things from I1a you should reuse rather than reinvent:

- **`_message` / `_read` in `packlets/tools/taskTools.ts`** — the failure path. Every failure the
  view reports reaches the model as `<tool>: <code>: <fixed description>`; the host's text goes to
  the optional `logger` only. Your new tools use the same path. A new `TaskFailureCode` must have a
  fixed description — the map is a `Record<TaskFailureCode, string>` so it cannot be missed.
- **`packlets/tools/viewAnswers.ts`** — every field a view returns is converted before anything
  reads it. A writer's answer gets the same treatment (see below).
- **`packlets/tools/schemas.ts`** and `types/tools.ts` — the schema and budget shapes.

## The decision this slice exists to take, and it is not the opt-in flag

**The model cannot see a revision.** `ITaskMutationIdentity` requires `expectedRevision`, and I1a's
`task_inspect` exposes **none** — no `revision` field appears anywhere in `packlets/tools/` or
`types/tools.ts`. So a mutation tool as the types stand is uncallable by the model, and there are
exactly three ways out:

1. **Widen the read surface** — `task_inspect` returns the revision it read, the model echoes it
   back. Preserves the precondition end to end. Costs a field on a shipped read surface, and means a
   stale inspection is the model's problem, which is the correct place for it.
2. **The tool reads, then writes** — the tool fetches the current revision itself and supplies it.
   **This defeats the precondition**: it converts optimistic concurrency into last-write-wins across
   the window between the tool's read and its write. Do not choose this without saying, explicitly,
   what now detects a concurrent host mutation.
3. **Refuse the shape** — conclude that unsupervised model-driven mutation of a task whose revision
   it cannot observe is not a surface that should exist, and say so.

**Decide it, implement it, and justify it in `result.md` against the other two.** This is the one
place in the slice where a brief's silence would be a defect; it is named here so it is not decided
by accident in the middle of writing a schema.

## Acceptance properties that are yours

From the plan's § I1 acceptance list, these are I1b's:

- **Mutation tools are absent by default.** A host that constructs the factory as I1a's tests do
  gets exactly `['task_query', 'task_inspect']`. That assertion already exists twice — extend those
  rather than adding a third shape: `test/unit/tools/factory.test.ts:43` (the factory's own output)
  and `test/unit/tools/requestCapture.test.ts:230` (what ai-assist actually sends). Assert *names*,
  never a count.
- **The model cannot acquire authority.** No schema accepts a `principal`, `scope`, `consumer` or
  actor field. A reassignment names a responsible party — so say what constrains the
  `IResponsibility` a model may name, and test a forged one.
- **The model cannot mint an `operationId`.** `ICreateTrackedTask` and `ITaskMutationIdentity` both
  require one, and a caller-chosen operation id is a live defect class in this cluster: T5's loop
  found that a **caller's** operation id could already occupy the key the list-completion pump would
  mint, which skipped the list on every pass forever. The model must not be able to name one — the
  host or the tool mints it. Say where it comes from and test that a model-supplied one is refused,
  not honoured.
- **The model cannot change a source binding or set external lifecycle.** `IRegisterExternalTask`
  and the external-source surface are not tool-reachable. Assert that by absence, in a test.
- **Direct calls with surplus fields fail** — not ignored. `strictObject`, revalidated inside
  `execute`.
- **Capability checks remain live.** Authority is asked at execution, never cached at factory time —
  including at factory time for the *opt-in itself*: opting a tool in is not authorizing it.
- **A writer's answer is checked the way a view's answer is.** This is the sharpest carry-forward
  from I1a, and it is the whole reason that slice ran five rounds: the loop was about never trusting
  a *view's* answer about what the model may see. `ITaskMutationResult` and `IReassignmentResult`
  come back from the same untrusted host surface — `disposition`, `revision`, `updateIds`,
  `previous` / `current`. Convert them before anything reads them, and before anything about them
  reaches the model.

Explicitly **not** yours: generated command tools (I1c), stop tools (I1d), `execute` /
`changeScopes` / `reparent` / `completeList` / `archive` / `reconcileListCompletions` /
`resolveCommands`. If you find yourself needing one, that is a finding to surface, not a scope to
expand.

## The disclosure lesson I1a paid for

Layer 1 and Copilot round 1 found the same defect at two depths: layer 1 saw an *unbounded* failure
message and fixed the bound; the *disclosure* survived, and a connection string reached the model in
layer 1's own test. **A model-facing failure path is a disclosure surface, not a formatting one.**

A mutation surface has more of them than a read surface does: a refusal can disclose that a task
exists, that a revision moved, that a parent the principal cannot see rejected the change. Enumerate
in `result.md` every refusal a mutation tool can return and what each one tells a model that asked
for something it may not have.

## Tests the plan singles out

- **`JsonSchema.toJson` wire assertions** on every new schema — assert the emitted wire schema, not
  just that a validator exists.
- **Execute malformed arguments without the harness.** A direct call bypasses harness validation
  entirely; `execute` must not trust that it ran.
- **Foreign task / parent ids and hidden-child traversal** — a mutation naming a task outside the
  view fails, and fails the same way whether the task does not exist or is merely invisible.
- **Disabled mutation tools** — the default-off property above.
- **Command schema / name collision** — a mutation tool name must not collide with I1c's generated
  command tool names. Say what reserves the namespace.
- **Capture the ai-assist outbound request and assert the tools were really sent.** I1a built this;
  extend it (`test/unit/tools/requestCapture.test.ts`) to the opt-in case — assert the exact tool
  names in the outbound body with mutations enabled and with them disabled. A test that mocks a tool
  call coming back proves nothing about whether the tool was offered.
  (`TESTING_GUIDELINES.md` § *Coverage Gap Resolution*.)

## Package surface

`libraries/ts-agent-tasks` only — the `tools` packlet and its types, converters and tests;
`CAPABILITIES.md`; this stream's artifacts; the plan's I1b status line and this stream's ledger
entry.

**Headroom.** The `tools` packlet's largest file is 336 lines; the package's largest is
`storage/repository.ts` at 1875 (125 under the 2000-line `max-lines` cap, which is a promoted P1 —
T8b paid it with a designed extraction). You are nowhere near it, but plan the file split before you
approach it rather than after. **Do not touch `storage/`** — nothing in this slice needs it.

## Review gates

1. **Layer 1, `code-reviewer`, before coverage closure.**
2. Then the implementer-driven Copilot loop.

I1a ran five rounds on a read surface. **Expect at least that here, and do not read a long loop as
evidence you were careless.** A mutation surface bound to a principal is an authorization boundary
in the sense `CODING_STANDARDS.md` § *Authorization boundaries are the same blind spot* means it:
every check can be present and one of them still run at the wrong moment. Per that section, layer 1
under-delivers here unless you ask it the right question — so **enumerate in `result.md` every
check-then-act window in the diff**: each `await` between an authorization and its write, each place
a value read before a call is used after it. A protection you cannot name that way is one nobody has
located precisely enough to test.

## Gates

- [ ] `rushx build` **zero warnings**; `rushx lint`; `rushx fixlint` before the final commit
- [ ] `rushx test` at 100 % coverage with **zero `c8 ignore`**
- [ ] `rush change --verify --target-branch origin/integration/agent-tasks-v1`; type the change file
      **`minor`** (`ts-agent-tasks` has never been published, so `major` is wrong however breaking —
      `ACTIVE_DEVELOPMENT.md` § *How to type a change file*)
- [ ] Repo-wide `rebuild` **and** `test` on the final source *(required if you widen the read
      surface — that changes what a shipped type returns)*
- [ ] `verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`,
      `verify-bundler-resolution`, `verify-tarball-exports`
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] **Revert matrix rows for this slice, run on the final source**, with per-row suite names
- [ ] Both review layers recorded in `result.md`
- [ ] The plan's I1b status line and this stream's ledger entry written as shipped **in this PR**

## Skills to load, and when

| when you are about to | load |
|---|---|
| write or review a converter, validator, or a `JsonSchema` | `/type-safe-validation` |
| write or review any `Result<T>`-returning code | `/result-pattern` |
| write or review tests | `/result-tests` |
| write anything that "feels general" | `/published-primitives-reflex` |

## Traps this cluster paid for

1. **The revert matrix is the highest-yield gate here, and it must run on final source.** It has
   found something material in four of the five slices that ran it: T3 (nine rows green, five real
   gaps), T8b, and T9 (four rows green, three real) found *missing protections*; I1a found **two of
   its own rows lying** — one came back green because the mutant was wrong, and one came back red
   for a reason unrelated to the protection it named. Both classes are why the gate exists. Re-verify
   every row you claim: revert the protection, watch *the named test* go red, restore it. A red row
   that is red for the wrong reason is no evidence for the protection it names.
2. **A single-mutation matrix cannot see a defence-in-depth pair.** T9 added `paired(...)` to
   `perf/mutationMatrix.js` for exactly this. If a protection has a backstop, use it.
3. **A test comparing a constant to a constant looks like a guard and is not.**
4. **Quote a suite and a total, not a bare ratio** — T7 reported "22 of 28" for a falsifier that
   re-ran at 26 of 33, because "28" named nothing anyone could count.
5. **A brief's arithmetic is a claim like any other.** Reproduce anything numeric here before relying
   on it — the orchestrator's capacity table for T8b modelled one dimension and bound on another at
   half the figure.
6. **A review round that posts zero comments is not evidence of a clean diff** — read the
   previously-missed block. T8 PR 1 hit that twice in four rounds, and I1a's round 5 posted a
   headline naming four findings it did not list.
7. **A finding that lives only in a PR body is thrown away.** Route anything outliving this slice to
   `docs/TECH_DEBT.md` **in this PR**.

## Exit artifact

`result.md`, opening with a one-line `**Shipped:** …` that becomes the capability-feed `sourceLine`
verbatim. It must record:

- **The revision decision**, argued against the two alternatives above.
- The opt-in shape, and the evidence that default construction yields exactly I1a's two tools.
- Where each `operationId` comes from, and what refuses a model-supplied one.
- Every refusal a mutation tool can return, and what each discloses to a caller who may not have the
  task.
- Every check-then-act window in the diff, and what re-checks after it.
- The request-body capture test in both configurations.
- The revert matrix rows, run on final source, with per-row suite names.
- Anything belonging to I1c/I1d, routed durably.

Keep `state.md` current. If the session crosses a context boundary, `state.md` plus this brief must
be enough to resume cold.

## Required reading, in order

1. This brief.
2. `.ai/tasks/active/agent-tasks-i1a/result.md` — the whole thing; it is the surface you extend.
3. `docs/design/agent-tasks/implementation-plan.md` § I1 — including the split table.
4. `libraries/ts-agent-tasks/src/packlets/tools/` — all five files.
5. `libraries/ts-agent-tasks/src/packlets/types/broker.ts` — `IBoundTaskView` vs `IBoundTaskWriter`,
   `ITaskMutationIdentity`, `ITaskMutationResult`, `IReassignmentResult`.
6. `.ai/tasks/active/agent-tasks-t5/result.md` — bound authority; the caller-chosen-operation-id
   finding.
7. `.ai/instructions/CODING_STANDARDS.md` § *Authorization boundaries are the same blind spot*.

## Missing-input rule

If a required-reading file does not exist, or a plan section does not say what this brief claims,
**STOP and surface the gap.** Do not reconstruct intent from surrounding code and proceed.
