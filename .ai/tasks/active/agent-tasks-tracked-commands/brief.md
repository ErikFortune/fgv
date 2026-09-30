# Stream brief — `agent-tasks-tracked-commands`

**Give `fgv.tracked@1`'s eleven transitions registered parameter schemas**, so a model can be offered
them as I1c command tools. Authorized proactively by the user (2026-09-30) rather than waiting for a
consumer — this is **not** a follow-the-debt-entry chore, it is a designed slice.

## Mission

`fgv.tracked@1` registers **no commands**. Its eleven transitions have converters
(`TaskConverters.broker.trackedCommand`) but no `JsonSchema`, so I1c's generator has nothing typed to
put on the wire, and **a model can create and edit a tracked task (I1b) but cannot move its
lifecycle.** Close that.

**The machinery below you is already complete** — verified, do not rebuild it:

- `broker/commands.ts` → `_prepare` accepts a native tracked command, checks the name against
  `trackedTaskCommandNames`, converts through `trackedCommand`, and refuses on a stale
  `expectedRevision`; then `evaluateTrackedCommand` and `commitTrackedCommand` apply it.
- `broker/reads.ts` already reports `availableTrackedCommands(status, …)`, which is what I1a's
  `task_inspect` surfaces as a task's `commands`.
- I1c generates one tool per `ITaskCommandToolSpec { kind, detailVersion, command, name?, description? }`
  from the registry, using each command handle's `parameters` as the wire schema.

So the missing piece is **registration**: `ITaskCommandDescriptor`s on `trackedTaskDescriptor()`.

**Dependencies:** I1c (landed). **You do not need T9 or I1d**, and must not reach for them.

## Branch and PR posture

- **Branch:** `claude/agent-tasks-tracked-commands`, cut off `integration/agent-tasks-v1` at the I1c
  landing.
- **PR into `integration/agent-tasks-v1`** — **not `release`.**
- **Artifacts in `.ai/tasks/active/agent-tasks-tracked-commands/`.** Finalizes at cluster close; do
  **not** run `/finalize-task`.
- **Runs in parallel with I1d.** I1d owns `packlets/tools/` and `fixedTaskToolNames`. **You must not
  touch either.** If you believe you need a tools change, stop and surface it — that is a collision,
  not a scope.

## The eleven transitions and their parameter shapes

From `types/trackedCommands.ts`, `TrackedCommand`:

| command(s) | parameters |
|---|---|
| `start`, `resume` | `Readonly<Record<string, never>>` — none |
| `wait` | `{ reason: IWaitingReason }` |
| `pause` | `{ reason: ITaskReason }` |
| `succeed` | `{ outcome: ITaskOutcome }` |
| `fail`, `cancel` | `{ reason: ITaskReason; outcome?: ITaskOutcome }` |
| `set-title` | `{ title: string }` |
| `set-description` | `{ description?: string }` |
| `set-progress` | `{ progress?: ITaskProgress }` |
| `set-attention` | `{ attention: ReadonlyArray<ITaskReference> }` |

`trackedTaskCommandNames` (in `types/builtins.ts`) is the existing name vocabulary — the schemas must
cover exactly it, and a test should pin that correspondence so a twelfth name cannot be added without
a schema.

## The decision this slice exists to take: two validators, or one

**`_prepare` does not consult the registry.** For a native tracked command it validates with
`core.converters.broker.trackedCommand` directly — it never calls the command handle's `validate`.
So registering schemas creates **two** validation paths for the same command:

- the **registered schema** — what the model is offered on the wire, and what the ai-assist harness
  validates the model's arguments against;
- **`trackedCommand`** — what the broker actually converts and stores, and therefore authoritative.

Note this is *weaker* than the external-command case. There, `createTaskCommandHandle` at least checks
that the *encoded* form re-validates against the schema. Here there is **no runtime cross-check at
all**: nothing would notice the two disagreeing.

Two ways, and this is the slice's central choice:

1. **Register schemas, accept a pure fixture obligation.** Smallest change, and it follows the
   `detailSchema` precedent exactly: agreement *"is a claim about every value, which no
   signature-level check can settle. It is a **fixture** obligation."* The cost is that the obligation
   is discharged only by tests you write, and a later edit to either side can silently break it.
   **If you choose this, the fixture tests are the deliverable, not an afterthought** — for each of
   the eleven, assert the schema and the converter accept and reject *the same* values, including the
   optional-field and empty-parameter edges.
2. **Unify — make `_prepare` validate through the registered handle.** One authority, no obligation
   to maintain. Bigger: it changes a broker path, so every native-kind command flows through the
   registry, and a kind that registers no schema for a name in `trackedTaskCommandNames` would then
   refuse where it previously worked. **Say explicitly what happens to such a kind**, and note that
   this direction narrows what the broker accepts, so per `CODING_STANDARDS.md` it needs a repo-wide
   `rush test`, not just a rebuild.

**Decide it, implement it, argue it against the other in `result.md`.** Do not silently pick (1)
because it is smaller — say why.

A note on how wrong disagreement can go: because `trackedCommand` stays authoritative under option 1,
a disagreement is a **usability** defect (a model offered a shape the broker refuses, or told
`invalid` for something the schema accepted), not a safety one. Say that plainly rather than
overclaiming risk — but do not use it as licence to skip the fixtures.

## What you must not decide for the host

**Which transitions a model may be offered is already the host's choice**, and the mechanism exists:
I1c's `enable` is `ReadonlyArray<ITaskCommandToolSpec>`, one entry per command. A host offers
`set-title` and withholds `succeed` by listing the first and not the second.

So **register schemas for all eleven** and do not hardcode a subset. The debt entry's "decide which
transitions a model may be offered at all" is answered by the opt-in, not by withholding a schema —
withholding one denies the capability to *every* host, including hosts driving their own trusted
actors. If you conclude some command genuinely must never be tool-reachable, that is a finding to
surface with its reason, not a quiet omission.

**Two of them carry a real hazard, and the write-up must name both:**

- **`set-attention` takes `ReadonlyArray<ITaskReference>`.** I1b deliberately refused to offer
  `attention` in its patch schema, because *"references are host-owned identities a model could
  forge."* Registering a schema does not offer the command, but a host reading your
  `CAPABILITIES.md` will reasonably assume it is safe to enable. **Document the hazard where a host
  will see it**, and say whether anything constrains a reference the broker accepts.
- **`succeed` and `fail` carry outcomes** a model would be asserting on the host's behalf. Same
  treatment: the host may enable them, and should be told what they mean.

## Acceptance

- All eleven commands registered on `fgv.tracked@1`, each with a `JsonSchema` wire schema, exposed
  through the registry so I1c's generator picks them up with no change to `packlets/tools/`.
- **An end-to-end test through the real broker**: a model calls a generated tracked command tool, the
  task's lifecycle actually moves, and `task_inspect` shows the new status. This is the whole point of
  the slice — a schema that is never driven end to end proves nothing.
- `JsonSchema.toJson` wire assertions for each new schema, pinned as literals, the way I1c pins its.
- Schema/converter agreement fixtures per the decision above.
- The schemas cover exactly `trackedTaskCommandNames`, pinned by a test.
- Empty-parameter commands (`start`, `resume`) work on the wire — check what an empty closed object
  emits and that each provider accepts it. I1c's Gemini note applies: its dialect drops
  `additionalProperties`.
- A stale `expectedRevision` still refuses (`_prepare`), and an unavailable transition still reads as
  the fixed line I1c gives a rejection — **no new disclosure channel.** `availableTrackedCommands`
  already gates what `task_inspect` reports; confirm a command not available for the current status
  refuses without saying which statuses would allow it.

## Gates

- [ ] `rushx build` **zero warnings**; `rushx lint`; `rushx fixlint` before the final commit
- [ ] `rushx test` at 100 % coverage with **zero `c8 ignore`**
- [ ] `rush change --verify --target-branch origin/integration/agent-tasks-v1`; change file **`minor`**
- [ ] **Repo-wide `rebuild`**; and **repo-wide `test`** if you take option 2 (it narrows what the
      broker accepts — a compiler cannot see that)
- [ ] `verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`,
      `verify-bundler-resolution`, `verify-tarball-exports`
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] **Revert matrix rows for this slice, run on final source** — `--pkg` with a `node_modules`
      symlink, per the runner's usage notes
- [ ] Both review layers recorded in `result.md`
- [ ] **A plan entry**: this slice is not in `docs/design/agent-tasks/implementation-plan.md` § I1's
      four-slice table. Add it where it belongs and say why it exists, and write the ledger entry and
      plan status as shipped **in this PR**
- [ ] `docs/TECH_DEBT.md`'s `fgv.tracked@1` entry **removed**, not amended — this closes it

## Skills to load, and when

| when you are about to | load |
|---|---|
| write or review a converter, validator, or a `JsonSchema` | `/type-safe-validation` |
| write or review any `Result<T>`-returning code | `/result-pattern` |
| write or review tests | `/result-tests` |

## Traps this cluster paid for

1. **A matrix row can be green while protecting the bug.** I1c round 1: the tool and the writer both
   ran the encoder, and the existing canonicalization fixture used a *whitespace-trimming* encoder —
   idempotent, so the defect and the protection were indistinguishable, and the row that "protected"
   canonical encoding was pinning the double-encode. **For any agreement fixture you write here, pick
   values that would expose a difference** — never one where the right and wrong answers coincide.
2. **A rule written one slice earlier did not survive one slice.** I1c round 2 reproduced I1b-10
   exactly: an identity read after the `await` it should precede. Read both rows before you write a
   check-then-act path.
3. **Re-verify every matrix row**: revert, watch *the named test* go red, restore. A row red for the
   wrong reason is no evidence.
4. **Quote a suite and a total someone can count.** I1c said a grep gave five files; it gave six.
5. **A brief's claims are claims.** This one asserts `_prepare` bypasses the registry, that the apply
   path is complete, and the eleven parameter shapes above. **Verify each before relying on it** — the
   I1c brief steered toward a schema-exposure option that could not work, and the implementer was
   right to reject it.
6. **A review round that posts zero comments is not evidence of a clean diff.**
7. **Copilot's API trigger is unreliable** — four `request_copilot_review` calls did nothing on I1b.
   Use a bare `@copilot review` **comment**.
8. **Route anything outliving this slice to `docs/TECH_DEBT.md` in this PR.**

## Exit artifact

`result.md`, opening with a one-line `**Shipped:** …` that becomes the capability-feed `sourceLine`
verbatim. It must record:

- **The one-validator-or-two decision**, argued against the alternative.
- The end-to-end evidence: which command moved which lifecycle, observed through `task_inspect`.
- The agreement fixtures, and for each, the value that would expose a disagreement.
- What a host is told about `set-attention`'s forgeable references and about `succeed`/`fail`
  asserting outcomes.
- Confirmation that no new disclosure channel opened — an unavailable transition says no more than
  I1c's fixed rejection line.
- The revert matrix rows on final source, with per-row suite names.
- Anything belonging to I1d, routed durably (and **nothing touching `packlets/tools/`**).

Keep `state.md` current; `state.md` plus this brief must be enough to resume cold.

## Required reading, in order

1. This brief.
2. `.ai/tasks/active/agent-tasks-i1c/result.md` — the generator you are feeding, and its two highs.
3. `libraries/ts-agent-tasks/src/packlets/types/trackedCommands.ts` — the eleven shapes.
4. `libraries/ts-agent-tasks/src/packlets/converters/builtinKinds.ts` — `trackedTaskDescriptor`, and
   `trackedTaskDetailSchema` as the shape to follow.
5. `libraries/ts-agent-tasks/src/packlets/broker/commands.ts` — `_prepare`, and where the native path
   validates.
6. `libraries/ts-agent-tasks/src/packlets/types/registry.ts` — `ITaskCommandDescriptor`,
   `ITaskCommandHandle`, and `ITaskKindDescriptor.commands`.
7. `libraries/ts-agent-tasks/src/packlets/converters/kindRegistry.ts` — `createTaskCommandHandle`.
8. `.ai/tasks/active/agent-tasks-i1b/result.md` § on what was deliberately **not** offered —
   `attention`, and why.

## Missing-input rule

If a required-reading file does not exist, or does not say what this brief claims, **STOP and surface
the gap.** Do not reconstruct intent from surrounding code and proceed.
