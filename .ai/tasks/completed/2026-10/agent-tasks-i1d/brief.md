# Stream brief — `agent-tasks-i1d`

**Slice I1d of four** — stop tools, the T9 opt-in. The last slice of I1.
`docs/design/agent-tasks/implementation-plan.md` § I1.

## Mission

Let a host opt a model into T9's cascade-stop surface. **Which of the four stop operations a model may
reach is the decision this slice exists to take** — see below. Bounded output, fixed refusals, schema
revalidation inside `execute`, exactly as I1a–I1c.

**Dependencies:** I1a, I1b, I1c and **T9**, all landed.

## Branch and PR posture

- **Branch:** `claude/agent-tasks-i1d`, cut off `integration/agent-tasks-v1` at the I1c landing.
- **PR into `integration/agent-tasks-v1`** — **not `release`.**
- **Artifacts in `.ai/tasks/active/agent-tasks-i1d/`.** Finalizes at cluster close; do **not** run
  `/finalize-task`.
- **Runs in parallel with `agent-tasks-tracked-commands`**, which owns
  `converters/builtinKinds.ts`, `types/trackedCommands.ts` and possibly `broker/commands.ts`. **You
  own `packlets/tools/` and `fixedTaskToolNames`; it must not touch them, and you must not touch
  its files.** A collision is a thing to surface, not to absorb.

## What I1a–I1c left you

`createTaskTools({ view, renderer?, budget?, logger?, mutations?, commands? })` builds `task_query`
and `task_inspect`, opt-in `task_create` / `task_update` / `task_reassign`, and opt-in generated
`task_command_<name>` tools. Reuse, do not reinvent:

- **`tools/toolSupport.ts`** — the shared failure path and `IFailureWording`
  (`thrown` / `unclassified` / `unknownOutcome` / `determinate` / `unknownLine`, `codeLine`).
- **`tools/writerAnswers.ts`** — receipt conversion. Read I1c's `command` converter and I1b's
  `_identified`: **both capture the identity they check against *before* the writer is called.** That
  rule was written in I1b (row I1b-10) and then missed in I1c, where Copilot round 2 found it as a
  high. Do not be the third.
- **`fixedTaskToolNames`** — I1c reserves the five existing names *whether or not they are offered*,
  and a test pins that list equal to the names the factory builds with everything on. **You must add
  your stop tool names to it**, and that test will fail until you do. I1c flagged this explicitly.
- `task_inspect` returns `revision`; `IStopRequest` and `IReleaseStop` both need `expectedRevision`,
  so that seam exists.

## The decision this slice exists to take: which stop operations a model may reach

T9's four operations are **not** four variations of one thing:

| operation | on | what it does |
|---|---|---|
| `inspectStop` | `IBoundTaskView` — **a read** | one intent's current result as this principal may see it; *"reading it performs no effect"* |
| `requestStop` | `IBoundTaskWriter` | persists the intent, its complete target set and each target's command key, and **freezes the subtree**, before anything is dispatched |
| `releaseStop` | `IBoundTaskWriter` | releases the latch. *"Applied stops are not undone and commands already sent are not retracted; nothing resumes."* A cancel whose root is terminal cannot be released |
| `reconcileStop` | `IBoundTaskWriter` | **the host's pump** — one bounded pass that dispatches, resolves and confirms. `limit` bounds stop commands, dispatches and source reads |

Decide, per operation, whether a model may reach it, and argue each in `result.md`. The considerations
you must engage rather than skip:

- **`inspectStop` is a read and I1a deliberately left it unused.** It is the obvious candidate for a
  model-facing tool, and the cheapest to justify.
- **`reconcileStop` is the host's pump and it performs effects.** I1c excluded `resolveCommands` for
  exactly that reason and said so. Work out whether the same reasoning applies here — and if you
  conclude a model may drive it, say what bounds the effects a model can cause in one turn, given
  `limit` is a caller-supplied number.
- **`releaseStop` un-freezes admission.** A model releasing a latch another principal requested is an
  authority question, not a convenience. Whose stop may a model release? Note `IReleaseStop` requires
  `intentId`, so answering this also decides the next point.
- **`intentId` is an `OperationId`, and I1b and I1c both deliberately withhold operation ids from the
  model** (I1b: the receipt's operation id is never returned). But `releaseStop` and
  `inspectStop` both need one to name an intent. If you offer either, you are disclosing an
  operation id — say why that is safe here when it was not there, or find another way to name an
  intent.

**If the honest answer for some operation is "a model must not reach this", that is a finding and a
shipped property, not a gap** — exactly as I1c concluded for command resends.

## The coherence question I1c left you

I1c maps `stop-active` to the **`conflict`** line, specifically so that a refusal *does not say a stop
exists* — and its `result.md` says in terms: *"that is I1d's surface to disclose."*

So: if a host enables stop tools, does `stop-active` become disclosable, while a host without them
keeps `conflict`? Both answers are defensible and they are not the same system:

- **Keep `conflict` always.** One refusal vocabulary regardless of configuration; a model that can
  inspect stops can find out by inspecting. Simpler, and no tool's presence changes another tool's
  answers.
- **Disclose when stop tools are enabled.** More useful, but a tool's output now depends on which
  *other* tools the host enabled, which is a coupling worth stating out loud.

Decide and say which. **Do not leave it implicit** — this is the one place where I1c deliberately
deferred to you, so silence here would lose the handoff.

## What `IStopResult` already projects, and what is still yours

T9 did the principal-level projection well; read it before deciding what to bound:

- `IProjectedStopTarget = Omit<IStopTarget, 'stableSourceEvidence'>` — source evidence is already gone.
- `targets` holds **only** targets the principal may read.
- `restrictedWorkRemains` says *"without counts or identities, that some target the principal cannot
  see is not confirmed."*

So the remaining questions are model-facing rather than principal-facing:

- **`capacity?: ICapacityFailure`** is present when a fresh attempt could not be admitted. That is
  host capacity information (T8b's model). Decide whether it reaches the model at all; default to no
  and say what the model is told instead.
- **`targets` is unbounded in length.** Every other tool in this packlet bounds its output —
  `task_query` refuses a `limit` above `budget.context.maxItems` rather than clamping, and names
  anything the text omitted. A subtree can be large. Say what bounds `targets`, and if some are
  omitted, **name them the way `task_query` names omissions** rather than silently truncating.
- `state` and `mode` are closed sets (`StopIntentState`, `StopMode`) — convert, do not trust.

**Convert the whole answer before anything reads it**, as `viewAnswers.ts` and `writerAnswers.ts` do.
Any `IBoundTaskView` may be passed in.

## Acceptance

- Stop tools absent by default; extend the existing exact-name assertions in
  `test/unit/tools/factory.test.ts` and `test/unit/tools/requestCapture.test.ts` (names, never counts),
  and `fixedTaskToolNames` updated with its pinning test passing.
- `JsonSchema.toJson` wire assertions on every new schema, pinned as literals.
- `execute` re-validates its arguments with **no harness in front**; surplus fields fail.
- **No principal, scope, consumer or actor field** in any schema.
- Capability checks live: authority asked at execution, never cached at factory time.
- Every refusal is a fixed line; **no host text reaches the model** — `ICapacityFailure` and any
  free-form reason go to `logger` only.
- The binding members the packlet reaches, asserted exactly with the recording proxy. I1a reached 2,
  I1b 5, I1c 6; state your number and assert everything else untouched.
- **An end-to-end test through the real broker**: a stop actually requested and reconciled, observed
  through whatever surface you offer.

## Gates

- [ ] `rushx build` **zero warnings**; `rushx lint`; `rushx fixlint` before the final commit
- [ ] `rushx test` at 100 % coverage with **zero `c8 ignore`**
- [ ] `rush change --verify --target-branch origin/integration/agent-tasks-v1`; change file **`minor`**
- [ ] Repo-wide `rebuild`, and repo-wide `test` if you change what anything accepts or classifies
- [ ] `verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`,
      `verify-bundler-resolution`, `verify-tarball-exports`
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] **Revert matrix rows, run on final source** — `--pkg` with a `node_modules` symlink
- [ ] Both review layers recorded in `result.md`
- [ ] **This closes I1.** The plan's I1d status line, the I1 section's own status, and the ledger entry
      all written as shipped **in this PR**

## Skills to load, and when

| when you are about to | load |
|---|---|
| write or review a converter, validator, or a `JsonSchema` | `/type-safe-validation` |
| write or review any `Result<T>`-returning code | `/result-pattern` |
| write or review tests | `/result-tests` |

## Review gates

1. **Layer 1, `code-reviewer`, before coverage closure** — ask the authorization-boundary questions
   directly; a generic "review this" under-delivers on this surface.
2. Then the Copilot loop, driven by a bare **`@copilot review` comment** (the API request did nothing
   four times on I1b).

**Expect a substantive loop.** I1a ran five rounds, I1b two (round 1 a real high), I1c three (rounds 1
*and* 2 each a real high). This slice touches admission and latching, so it is squarely the
authorization-boundary class `CODING_STANDARDS.md` describes. Stop on a round's finding profile going
nitpicky, never on round count.

## Traps this cluster paid for

1. **A matrix row can be green while protecting the bug.** I1c round 1: the tool and the writer both
   ran the encoder, and the fixture's encoder was whitespace-trimming — idempotent — so the defect and
   the protection were indistinguishable, and the row "protecting" canonical encoding pinned the bug.
   Choose fixture values that would expose a difference.
2. **A rule written one slice earlier did not survive one slice** — I1b-10's capture-before-the-await
   rule reappeared as an I1c high. See the `writerAnswers.ts` note above.
3. **Re-verify every row**: revert, watch *the named test* go red, restore.
4. **`? red` is now `UNVERIFIED`** and exits 1 — a `--pkg` copy without a `node_modules` symlink runs
   no tests at all, and used to report as a pass.
5. **A single-mutation matrix cannot see a defence-in-depth pair** — use `paired(...)`, and if one
   half is masked, say so as I1c did for I1c-2 rather than claiming both halves proven.
6. **Quote a suite and a total someone can count** — I1c said a grep gave five files; it gave six.
7. **A brief's claims are claims.** This one asserts what each stop operation does, what
   `IStopResult` projects, and that `fixedTaskToolNames` has a pinning test. **Verify before
   relying on it** — the I1c brief pushed a schema option that could not work, and was right to be
   overruled.
8. **A review round that posts zero comments is not evidence of a clean diff.**
9. **Route anything outliving this slice to `docs/TECH_DEBT.md` in this PR.**

## Exit artifact

`result.md`, opening with a one-line `**Shipped:** …` that becomes the capability-feed `sourceLine`
verbatim. It must record:

- **The per-operation decision** for `inspectStop` / `requestStop` / `releaseStop` / `reconcileStop`,
  each argued, including any you deliberately do not offer.
- **The `stop-active` coherence answer**, and whether a tool's output depends on which other tools the
  host enabled.
- Whether an `intentId` reaches the model, and why that is safe here when operation ids are withheld
  elsewhere.
- What bounds `targets`, and how omissions are named.
- What the model is told when `capacity` is present.
- Every check-then-act window in the diff, and what re-checks after it.
- The binding members reached, asserted.
- The revert matrix rows on final source, with per-row suite names.
- **That I1 is complete**, and anything the cluster still owes routed durably.

Keep `state.md` current; `state.md` plus this brief must be enough to resume cold.

## Required reading, in order

1. This brief.
2. `.ai/tasks/active/agent-tasks-i1c/result.md` — the surface you extend, its two highs, and the
   `stop-active` handoff.
3. `.ai/tasks/active/agent-tasks-t9/result.md` — the cascade-stop design you are exposing.
4. `docs/design/agent-tasks/implementation-plan.md` § I1.
5. `libraries/ts-agent-tasks/src/packlets/types/stop.ts` — `IStopRequest`, `IReleaseStop`,
   `IStopReconcileRequest`, `IStopInspectRequest`, `IStopResult`, `IProjectedStopTarget`,
   `StopMode`, `StopIntentState`.
6. `libraries/ts-agent-tasks/src/packlets/types/broker.ts` — `inspectStop` on the view; the three
   writer operations and their TSDoc.
7. `libraries/ts-agent-tasks/src/packlets/tools/` — all of it.
8. `.ai/instructions/CODING_STANDARDS.md` § *Authorization boundaries are the same blind spot*.

## Missing-input rule

If a required-reading file does not exist, or does not say what this brief claims, **STOP and surface
the gap.** Do not reconstruct intent from surrounding code and proceed.
