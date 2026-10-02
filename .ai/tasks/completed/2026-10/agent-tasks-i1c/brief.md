# Stream brief — `agent-tasks-i1c`

**Slice I1c of four** — statically generated typed command tools.
`docs/design/agent-tasks/implementation-plan.md` § I1.

## Mission

Generate one `IAiClientTool` per registered command, from the kind registry, with the **registered
parameter schema on the wire** — not an arbitrary payload object. Opt-in, like I1b's mutations.

**Dependencies:** I1a and I1b (both landed). **You do not need T9**, and you must not reach for it —
`inspectStop` / `requestStop` / `releaseStop` / `reconcileStop` are I1d's.

## Branch and PR posture

- **Branch:** `claude/agent-tasks-i1c`, cut off `integration/agent-tasks-v1` at the I1b landing
  (`6344c1acb`) and pushed.
- **PR into `integration/agent-tasks-v1`** — **not `release`.**
- **Artifacts in `.ai/tasks/active/agent-tasks-i1c/`.** This family finalizes at **cluster close**.
  Do **not** run `/finalize-task`.

---

## What I1a and I1b left you

`createTaskTools({ view, renderer?, budget?, logger?, mutations? })` builds `task_query` and
`task_inspect`, and — when `mutations: { writer, environment, enable }` is given, with `writer ===
view` — `task_create`, `task_update`, `task_reassign`. Reuse rather than reinvent:

- **`tools/toolSupport.ts`** — the shared failure path. `argumentMessage`, `askView`,
  `convertAnswer`, `hostFailure`, and `IFailureWording` (`thrown` / `unclassified` /
  `unknownOutcome`). A failure reaches the model as `<tool>: <code>: <fixed description>`; host text
  goes only to `logger`. **A command needs its own wording**, for the reason in *The outcome model
  is different here* below.
- **`tools/writerAnswers.ts`** — where a command receipt converter belongs (I1b said so explicitly).
  Read `_identified` first: it ties a receipt to the task, operation and revision asked about.
- **`tools/mutationTools.ts`** — the opt-in shape, id minting, and `_mutate`.
- **`types/tools.ts`** — `ITaskToolBudget`, `TaskMutationToolGroup`, `ITaskMutationToolResult`.
- **`task_inspect` returns `revision`**, which a change passes back as `expectedRevision`. Commands
  need it too (`ICommandRequest.expectedRevision`), so that seam is already built.

**The five names are reserved and a test pins them distinct:** `task_query`, `task_inspect`,
`task_create`, `task_update`, `task_reassign`. A generated tool must not collide with any of them,
and nothing currently enforces that — it is routed in `docs/TECH_DEBT.md` **with I1c as the
trigger**. Closing it is yours.

---

## The decision this slice exists to take: the handle does not expose its schema

`ITaskCommandDescriptor<P>.parameters` is a `JsonSchema.ISchemaValidator<P>` and its docstring calls
it *"one schema that is both the runtime validator and the wire schema a model is offered."* But the
registry never hands that schema back. `createTaskCommandHandle`
(`packlets/converters/kindRegistry.ts:30`) is documented as

> *"the single point at which a command's parameter type leaves the type system, and it leaves
> through a closure rather than a cast: `validate` captures the descriptor's own schema and encoder,
> so the only way to produce canonical parameters is to have passed that schema."*

So `ITaskCommandHandle` carries `name`, `idempotency`, `conditional` and `validate(unknown):
Result<JsonValue>` — **and no readable schema.** Enumeration works
(`ITaskKindHandle.commandNames`, `getCommand(name)`); reading the schema does not. The plan's
acceptance demands *"tool schemas encode registered parameter types rather than arbitrary payload
objects"*, so something has to give. Three ways, and the trade-off is about that closure guarantee:

1. **Expose the validator** — `readonly parameters: JsonSchema.ISchemaValidator<unknown>` on
   `ITaskCommandHandle`. Smallest change, and `validate` remains the only path to *canonical*
   parameters (it also runs `encode` and re-validates the encoded form). But the guarantee stops
   being structural and becomes an argument, and `P` is lost.
2. **Expose only the wire form** — `readonly parameterSchema: JsonValue`, the already-emitted
   `toJson()`. The model needs the wire schema, not a validator, and a `JsonValue` **cannot** be used
   to validate, so the closure guarantee holds *by construction* rather than by reasoning. Costs a
   member that duplicates information the closure already holds.
3. **Take schemas from the host instead** — `createTaskTools` accepts a name→schema map. No contract
   change, but the schemas are then not *from the registry*, which is the thing the acceptance
   criterion asks for, and a host could offer a schema the validator disagrees with.

**Decide it, implement it, and argue it against the other two in `result.md`.** Note that (1) and (2)
both **widen a shared contract**, which makes the repo-wide rebuild a checked box, not a habit — and
`grep -rl 'ITaskCommandHandle' --include=*.ts libraries/ tools/ samples/` for implementers and test
doubles, which is where the last four such changes broke.

Whatever you choose, the `detailSchema` precedent applies and is worth quoting in `result.md`:
agreement between a schema and its converter *"is a claim about every value, which no signature-level
check can settle. It is a **fixture** obligation."* For commands, `createTaskCommandHandle` does
check one half of it — the encoded form must re-validate — so say precisely what is checked and what
remains a fixture obligation.

## The outcome model is different here, and this is where the disclosure is

I1b's receipts were `ITaskMutationResult` — `taskId`, `revision`, `operationId`, `disposition`,
`updateIds`. All structured, all closed domains. **`ICommandReceipt.result` is a `CommandState`, and
three of its five shapes carry free-form host strings:**

| shape | carries |
|---|---|
| `rejected` | `reason: CommandRejectionReason` — a closed set, but see below |
| `accepted` | `sourceReceipt?: string` — **opaque host/source text** |
| `applied` | `appliedRevision: TaskRevision` |
| `indeterminate` | `reason: string` — **free-form host text** |
| `abandoned` | `reason: string` + `from: CommandAbandonmentOrigin` — **free-form host text** |

This is exactly the defect I1a spent four Copilot rounds on, arriving pre-built. A connection string
reached the model there through *one* forwarded message; here there are three channels, and one of
them (`sourceReceipt`) is an identifier a source chose. **None of them may reach the model.** Say in
`result.md` what the model is told for each of the five states, and what goes to `logger` instead.

**And `CommandRejectionReason` is a disclosure even though it is a closed set.** It separates
`denied` from `unsupported`, `conflict`, `invalid-transition`, `stop-active` and
`idempotency-conflict`. I1a and I1b deliberately collapsed hidden / foreign / denied into a single
`not-found-or-denied` line so a refusal distinguishes nothing. Forwarding `denied` verbatim tells a
model "you are not permitted", which is precisely the distinction that was removed. Decide what a
model is told, and justify it — `stop-active` in particular says a stop exists, which is I1d's
surface, not yours.

## Idempotency: I1b's rule may be wrong for commands

I1b mints a **fresh operation id on every call**, deliberately, so that a model can never replay
another principal's receipt or occupy a key a host pump would mint, and so a retry is never a replay.

Commands declare `idempotency: 'source-key' | 'none'`, and `source-key` means *"the source itself
deduplicates the same key, which is what makes a safe resend possible after an uncertain dispatch"*
(`ITaskCommandDescriptor` docstring). So for a `source-key` command, minting fresh on a retry may
**defeat** the dedup that makes the resend safe — the opposite of I1b's intent.

Work out what is actually true here — including whether a model-driven retry should reach `execute`
at all, or whether the uncertain-command pump (`resolveCommands`, which is **not** yours) is the
only correct resend path — and say so. Do not silently inherit I1b's rule; it was reasoned for
catalog mutations, and this is a different mechanism. **If the honest answer is that a model must not
retry a command itself, that is a finding, not a gap.**

Also: `conditional` states whether a command can carry a source precondition. Decide whether a model
may set one, and default to no unless you can say why.

## Acceptance properties that are yours

From the plan's § I1 acceptance list:

- **Tool schemas encode registered parameter types** — per the decision above. `JsonSchema.toJson`
  wire assertions on generated schemas, pinned as literals the way I1a/I1b pin theirs.
- **Generated tools are opt-in**, and absent by default. Extend the existing name assertions rather
  than adding a third shape: `test/unit/tools/factory.test.ts` and
  `test/unit/tools/requestCapture.test.ts` both pin exact names, including in the outbound body.
- **No command schema / name collision** — with the five reserved names, and between two kinds
  declaring the same command name. Say what reserves the namespace and what happens on a clash:
  refuse at build time, or namespace the tool. A silent last-one-wins is the defect.
- **The model cannot name an `operationId`** (closed schemas; the tool mints) — subject to the
  idempotency question above.
- **Revoked command authority** is refused — the plan names this test explicitly, and it needs a
  command to revoke authority *for*, which is why it is I1c's and not I1a's.
- **Capability checks remain live**; generation at factory time asks the registry, never the policy.
- **`execute` is the sixth binding member** the packlet reaches. I1a reached two, I1b five. Assert
  the new set exactly, with the recording proxy `mutations.test.ts` already uses — and that
  `changeScopes`, `reparent`, `completeList`, `archive`, `reconcileListCompletions`,
  `resolveCommands`, `registerExternal` and every stop method are still untouched.

Explicitly **not** yours: stop tools (I1d), `createTaskList`, `resolveCommands`.

## Review gates

1. **Layer 1, `code-reviewer`, before coverage closure.** Ask it the authorization-boundary
   questions directly, as I1b did — a generic "review this" under-delivers here.
2. Then the Copilot loop.

**Expect a substantive loop and do not stop early.** I1b ran two rounds: round 1 found a real high
(an unclassified writer failure read to the model as a refusal, when the writer may have committed),
and round 2 refuted round 1's *own stated reasoning* about revisions. I1a ran five. This slice adds
the first tool that dispatches to an **external** executor, so its outcome is genuinely unknown in
more ways than a catalog commit's — budget accordingly, and stop only when a round's finding profile
goes nitpicky, never on round count.

**Mechanism note, learned the hard way on I1b:** `request_copilot_review` through the API silently
did nothing four times (16:32, 16:48, 17:21, 18:23 UTC). The review ran only after a plain
`@copilot review` **comment**. Use the comment.

## Package surface

`libraries/ts-agent-tasks` only — the `tools` packlet and its types, converters and tests; the
registry/command contract change if you take one; `CAPABILITIES.md`; this stream's artifacts; the
plan's I1c status line and this stream's ledger entry.

**Headroom.** The `tools` packlet's largest file is `mutationTools.ts` at ~330 lines; the package's
largest is `storage/repository.ts` at 1875, 125 under the 2000-line `max-lines` cap (a promoted P1 —
T8b paid it with a designed extraction). Plan the file split before you approach it. **Do not touch
`storage/`.**

## Gates

- [ ] `rushx build` **zero warnings**; `rushx lint`; `rushx fixlint` before the final commit
- [ ] `rushx test` at 100 % coverage with **zero `c8 ignore`**
- [ ] `rush change --verify --target-branch origin/integration/agent-tasks-v1`; change file **`minor`**
      (`ts-agent-tasks` has never been published, so `major` is wrong however breaking —
      `ACTIVE_DEVELOPMENT.md` § *How to type a change file*)
- [ ] **`node common/scripts/install-run-rush.js rebuild` if you widen `ITaskCommandHandle`** — a
      shared contract others implement; also grep for test doubles
- [ ] **`node common/scripts/install-run-rush.js test` if you change what anything accepts or
      classifies** — a rebuild is a compiler and cannot see a widened accepted set
- [ ] `verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`,
      `verify-bundler-resolution`, `verify-tarball-exports`
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] **Revert matrix rows for this slice, run on final source**, with per-row suite names
- [ ] Both review layers recorded in `result.md`
- [ ] The plan's I1c status line and this stream's ledger entry written as shipped **in this PR**

## Skills to load, and when

| when you are about to | load |
|---|---|
| write or review a converter, validator, or a `JsonSchema` | `/type-safe-validation` |
| write or review any `Result<T>`-returning code | `/result-pattern` |
| write or review tests | `/result-tests` |
| write anything that "feels general" | `/published-primitives-reflex` |

## Traps this cluster paid for

1. **The revert matrix is the highest-yield gate, and it must run on final source.** It has found
   something material in five of the six slices that ran it: T3 (nine rows green, five real gaps),
   T8b, T9 (four green, three real) found missing protections; I1a found two of its own rows lying;
   I1b found one row green because its mutant was invisible to the test. **Use `--pkg` with a
   `node_modules` symlink**, as the usage notes say — a copy without one runs no tests at all.
2. **A row that is red for the wrong reason is no evidence for the protection it names.** Re-verify
   each row: revert, watch *the named test* go red, restore.
3. **A single-mutation matrix cannot see a defence-in-depth pair.** Use `paired(...)` (T9 added it;
   I1b's rows 4 and 5 use it for the minted ids).
4. **A test comparing a constant to a constant looks like a guard and is not.**
5. **Quote a suite and a total, not a bare ratio** — T7 reported "22 of 28" for a falsifier that
   re-ran at 26 of 33.
6. **A brief's arithmetic is a claim like any other.** Reproduce anything numeric here before
   relying on it — including this brief's line counts and its reading of the registry.
7. **A review round that posts zero comments is not evidence of a clean diff** — read the
   previously-missed block. I1a's round 5 posted a headline naming four findings it did not list.
8. **When a later round refutes an earlier round's reasoning, fix the earlier record too.** I1b left
   a refuted sentence in its round-1 row, a few lines above the correction.
9. **A finding that lives only in a PR body is thrown away.** Route anything outliving this slice to
   `docs/TECH_DEBT.md` **in this PR**.

## Exit artifact

`result.md`, opening with a one-line `**Shipped:** …` that becomes the capability-feed `sourceLine`
verbatim. It must record:

- **The schema-exposure decision**, argued against the two alternatives.
- **What the model is told for each of `CommandState`'s five shapes**, and what goes to `logger` —
  naming `sourceReceipt` and both `reason: string` channels explicitly.
- **What a model is told about a rejection**, and why that does not restore the distinction
  `not-found-or-denied` removed.
- **The idempotency answer**, including whether a model may retry a `source-key` command at all.
- How generated names are kept clear of the five fixed ones, and what happens on a clash.
- The exact binding members the packlet reaches, asserted.
- Every check-then-act window in the diff, and what re-checks after it.
- The revert matrix rows, run on final source, with per-row suite names.
- Anything belonging to I1d, routed durably.

Keep `state.md` current. If the session crosses a context boundary, `state.md` plus this brief must
be enough to resume cold.

## Required reading, in order

1. This brief.
2. `.ai/tasks/active/agent-tasks-i1b/result.md` — the surface you extend, and its two Copilot rounds.
3. `docs/design/agent-tasks/implementation-plan.md` § I1 — including the split table.
4. `libraries/ts-agent-tasks/src/packlets/tools/` — all eight files.
5. `libraries/ts-agent-tasks/src/packlets/types/commands.ts` — `ICommandRequest`, `ICommandReceipt`,
   `CommandState`, `CommandRejectionReason`, `ITaskCommandDescriptor`.
6. `libraries/ts-agent-tasks/src/packlets/types/registry.ts` — `ITaskCommandHandle`,
   `ITaskKindHandle`, `ITaskKindRegistry`.
7. `libraries/ts-agent-tasks/src/packlets/converters/kindRegistry.ts` — `createTaskCommandHandle`,
   the erasure point.
8. `.ai/tasks/active/agent-tasks-t6/result.md` — command dispatch and reserved commands.
9. `.ai/instructions/CODING_STANDARDS.md` § *Authorization boundaries are the same blind spot*.

## Missing-input rule

If a required-reading file does not exist, or a plan section does not say what this brief claims,
**STOP and surface the gap.** Do not reconstruct intent from surrounding code and proceed.
