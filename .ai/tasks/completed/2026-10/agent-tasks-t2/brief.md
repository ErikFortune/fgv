# Stream brief — `agent-tasks-t2`

**Status: 🟢 ready.** Drafted 2026-09-22, from the agent-tasks design bundle
(`docs/design/agent-tasks/`), slice **T2**.

## Mission

Land slice **T2** — the pure context and snapshot-only entry point of `@fgv/ts-agent-tasks`:
deterministic selection and rendering, current/update/attention fragments, budgets and omissions,
a pure inclusion receipt, and a safe bounded projection seam.

The plan calls this "**a complete usable snapshot-only entry point without a broker**." That is the
point of the slice: after T2 a host can render task context and get an honest receipt for what it
included, with no storage, no broker, and no infrastructure at all.

## Branch and PR posture

| | |
|---|---|
| Integration branch | `integration/agent-tasks-v1` (T1 landed there as `1337c27c`) |
| T2 | `claude/agent-tasks-t2` → PRs into the integration branch |
| Squash to `release` | opened by the orchestrator, **not** by the implementing agent |

Change-file verification targets the integration branch:
`rush change --verify --target-branch origin/integration/agent-tasks-v1`.

CI runs on PRs into `integration/**`. If a PR shows no checks, stop and say so.

**T1 + T2 is the intended first squash to `release`** — the first coherent consumer-facing unit.
T3 and beyond form later batches.

## You hold licence to revise T1's vocabulary

T1 shipped **15 closed sets, 101 members, every one shape-exercised and roughly half
choice-unexercised** (its `result.md` carries the declared-vs-exercised table). `TaskFailureCode` is
the starkest: 14 codes, 5 with any T1-side meaning. Those members are predictions about slices that
do not exist yet.

**T2 is the first slice to exercise any of them for real**, and nothing has reached `release`, so a
revision costs a diff rather than a migration. If a union member is wrong, misnamed, or missing for
what rendering actually needs, **change it** — do not contort T2 to fit a guess. Record what you
changed and why in `result.md`, and update T1's declared-vs-exercised table rather than leaving it
describing a vocabulary that has moved.

This is also why T2 runs **before** T3 rather than in parallel with it: T2 is pure and cheap, so it
is the cheapest place to discover that T1's vocabulary is wrong. T3 writes that vocabulary into
durable records on disk, where the same discovery costs a storage-format change.

## Package surface

- `libraries/ts-agent-tasks/src/packlets/context/` — **new**, the home for this slice
- `libraries/ts-agent-tasks/src/packlets/converters/` — additions only, where rendering needs them
- `libraries/ts-agent-tasks/src/packlets/types/` — **revisions permitted** (see above)
- the package's root exports, `CAPABILITIES.md`, `README.md` and API report

## Out-of-scope

- **Any storage, filesystem, clock, random or checkpoint call.** T2's acceptance criterion is that
  there are none — this is not merely "don't add I/O", it is a property the tests must establish.
- The **broker** (T5), **durable records** (T3), **indexes and paging** (T4), **subscriptions and
  acknowledgement** (T7). T2 produces a *pure inclusion receipt*; the bound delivery service that
  persists issued receipt manifests is T7's.
- The deferred **input-request/answer protocol** — gate #6. Attention is an *opaque host-owned
  reference*, nothing more.
- Any **task runner, scheduler or retry policy**.
- **Source-specific fields or consumer vocabulary.**
- Every other package, consumed unchanged. An upstream bug is an escalation, not a fix you fold in.

## Deliverables (plan § T2)

Deterministic selection/rendering, current/update/attention fragments, budgets/omissions, pure
inclusion receipt and safe bounded projection seam.

## Acceptance (plan § T2)

- **Same validated input and budget produces the same output.** Determinism is the contract.
- **No filesystem, clock, random or checkpoint calls.**
- **Only actually-included revisions and update IDs appear in receipts.** A receipt that claims more
  than it delivered is the failure this slice exists to prevent.
- **A required delivery payload that does not fit remains unacknowledged.** Not truncated-and-
  acknowledged, not silently dropped.
- **Partial visible trees never establish parent completion.**
- **Treat task prose as data.** Never as instructions, never as markup that can escape its frame.

## Tests (plan § T2 — this list is the specification, not a suggestion)

Overlapping scopes already reduced to duplicate snapshots; duplicate conflicting revision data; all
budget boundaries **including the framing reserve**; depth omissions; unknown totals; empty data;
partial and non-exhaustive input; multi-revision required updates; truncation of results; hostile
task text, Mustache and control characters; and snapshot receipts without event history.

**Establish the no-writes property by spying on injected dependencies or module boundaries — not by
comparing final checkpoints.** Equal checkpoints prove nothing about whether a write happened.

## Repo gates

- [ ] `rushx build` — **zero warnings**
- [ ] `rushx lint` passes; `rushx fixlint` before the final commit
- [ ] `rushx test` — 100% on all four metrics
- [ ] `code-reviewer` **before** closing coverage gaps
- [ ] `node common/scripts/install-run-rush.js rebuild` passes
- [ ] Change file, verified against the integration branch
- [ ] `CAPABILITIES.md` updated in the same PR; index row still one line
- [ ] **Run every step `.github/workflows/ci.yml` runs.** T1 lost a CI round to
      `generate-capability-feed.mjs --check`, a step no local checklist named. Its `result.md`
      carries the nine-step list.

## Traps T1 paid for — inherit the lessons, not the cost

- **A bounded array whose entries carry an identity needs a uniqueness constraint, not just a length
  cap.** T1 hit this three times in one review loop and missed it twice after fixing it once.
- **A test that checks a constant against a constant looks like a guard and is not.** T1's
  round-4 test pinned two defaults equal, which said nothing about the host-supplied case that
  actually broke — and CodeRabbit found the hole that test appeared to cover.
- **A review round that posts zero comments is not evidence of a clean diff.** One of T1's Copilot
  rounds posted nothing while its summary's "previously missed" block carried six real findings.
  **Read the summary, not the comment count.**
- **Symmetry holes are the shape to look for here.** T1's most valuable finding was `encode`
  bypassing a converter that `decode` ran. T2's equivalent: any path that renders without
  validating, or reports without checking what it actually included.

## Open questions, neither T2's to answer

1. **The source-history spelling is not settled in the design.** §5's `ITaskSource.history` says
   `'latest-snapshot' | 'replayable-updates'`; §1 and §8.6 say `'observed-state'` and
   `'source-replay'`. T1 unified on the §8.6 spelling. **T6** confirms or revises. If T2 needs to
   name it, follow T1 and say so in `result.md`.
2. **Executor-payload dereference** — may terminal presentation dereference an executor-owned
   payload after the broker update is acknowledged? A §8.3 / **T6** / **T8** decision, carried to
   the design authority. It did **not** reach T1. If it reaches T2 — and a *presentation* slice is a
   plausible place for it to — **stop and surface it** rather than encoding an answer.

## Exit artifact

T2 does **not** close the stream; T3 and beyond follow. Artifacts stay in
`.ai/tasks/active/agent-tasks-t2/`. **Do not run `/finalize-task`.**

`result.md` must carry: what shipped; **which T1 union members T2 actually exercised, and any it
revised, with the reasoning**; which acceptance criterion each test establishes; and what a later
slice must decide.

## Required reading, in order

1. `docs/design/agent-tasks/implementation-plan.md` § *T2* — the authority for this slice.
2. `.ai/tasks/active/agent-tasks-t1/result.md` — **especially the declared-vs-exercised table.**
   This tells you which of T1's vocabulary is load-bearing and which is a guess you may revise.
3. `docs/design/agent-tasks/development-design.md` — the engineering contract; the sections on
   context selection, budgets and receipts.
4. `docs/design/agent-tasks/fgv-library.md` — what the library is and refuses to be.
5. `docs/design/agent-tasks/deferred.md` — gate #6 and the rule that a correctness requirement
   cannot be labelled future work while advertising the guarantee it would make true.
6. `libraries/ts-agent-tasks/` as it stands — T1's types, converters and registry are what you build
   on.

## Missing-input rule

If any required-reading file does not exist, or any statement here does not match what you find in
the tree, **STOP and surface the gap.** Do not reconstruct missing context by inference.
