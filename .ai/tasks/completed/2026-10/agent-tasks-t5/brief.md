# Stream brief — `agent-tasks-t5`

Slice **T5 — Bound authority, tracked hierarchy and reassignment** of
`docs/design/agent-tasks/implementation-plan.md` § 5.

## Mission

Build the broker layer over T4's indexed storage: host-bound views and sanitized projections,
create/update of tracked work, task-list completion, scopes and graph integrity, current-authority
and policy-epoch checks, and a revisioned responsibility operation that carries assignment updates.
A typed direct API — **no native business I/O**.

The plan's own one-line summary of the acceptance bar: *parentage, responsibility, visibility and
authority remain independent.* Four axes that are easy to collapse into each other and must not be.

## Branch and PR posture

- **Branch:** `claude/agent-tasks-t5`, already created off `integration/agent-tasks-v1` at
  `536858eb9` and pushed.
- **PR into `integration/agent-tasks-v1`** — **not `release`.** T1–T4 all landed there and the
  cluster squashes to `release` as one promotion when the slices are done.
- The integration branch now carries `release` through **#689**, merged up at `8ecb53a5`. So you
  have F1+F2 atomic write, the ai-assist streaming cache, and the prompt-assist qualifier-stability
  work beneath you. Nothing in those overlaps `ts-agent-tasks`, which depends only on
  `@fgv/ts-json-base` and `@fgv/ts-utils`.
- **Artifacts stay in `.ai/tasks/active/agent-tasks-t5/`.** This family finalizes at **cluster
  close**, not per slice — T1 through T4 are all still under `active/`. Do **not** run
  `/finalize-task` or migrate to `completed/`.

## The review gate is a design constraint, not a checklist item

T4's gate was performance and its evidence was counters. **Yours is a threat model.** The plan
states it as: *threat-model/ownership pass, authorization at every read and mutation boundary,
source metadata immutability.*

Read that as a shape requirement, not a final audit. **"Every read and mutation boundary" means the
authorization check cannot live in one entry-point wrapper** that later refactors route around. A
projection that is sanitized because the *caller* asked for a sanitized view is a different — and
weaker — design than one that cannot produce unsanitized data for an unauthorized principal at all.
Prefer the second, and say in `result.md` which you built and why.

The test list names the adversarial cases directly, and they are the specification: **fabricated
principal and scope filters, foreign IDs, policy revocation between check and commit, projector
failure without full-data fallback.** That last one is the tell for this slice — *a projector that
fails must not fall back to full data.* Failing closed is the requirement; a fallback that yields
more data than the principal may see is the defect the gate exists to catch.

## The four axes, and why they are listed separately

*Parentage, responsibility, visibility and authority remain independent.* Some concrete
consequences the acceptance criteria spell out:

- **Reassignment preserves ID, record path, children, scopes, results and source binding.** It
  updates **only** responsibility plus revision/operation/update metadata. A reassignment that
  moves children, or re-homes a record, has collapsed responsibility into parentage.
- **No implicit child reassignment**, and **no artifact/visibility grant** riding along with a
  responsibility change.
- **Source lookup still targets the original actor-local store** after reassignment.
- **An observation-only external registration permits authorized catalog reassignment** — so
  observation-only constrains what the *source* may do, not what an authorized catalog operation
  may do.

## Concurrency and crash recovery — the two hardest acceptance items

**One writer rejects stale updates and serializes parent changes against cycle checks.** The
concurrent case is named: *A→B versus a stale A write.* A cycle check that passes and then commits
against a graph that moved is the classic failure; serialize the check and the commit, do not merely
order them hopefully.

**Crash after the last child succeeds but before list completion.** On reopen the repository must
**rebuild a completion candidate**, and the authorized host pump must **recheck current membership
and stops before completing it**. Two properties fall out and both need tests: an unresolved child
**prevents** completion, and list completion uses the **complete authoritative child set** — not
the set the crashed writer had in hand.

Also pinned: **terminal/archived graph-edge immutability, and parent resolution through tombstones.**
T4 kept identity, parent edge, children, final status and source binding resident after archive
precisely so this works; use it rather than re-reading records.

## A3 — acceptance reservations, and a live inconsistency you must not make worse

A3 requires that task acceptance **reserves** first resolution where needed, terminal
outcome/audiences, bounded disposition and archive; that metadata/audience changes **preserve or
increase** those claims before acceptance; and that at ordinary operation limits the system
**rejects new identities while same-key replay, reserved terminal completion and eligible archive
remain possible**. Completion of a parent from already-accepted children must use its **reserved
terminal path**.

That last group is the interesting one: running out of capacity must not strand accepted work.
Rejecting new identities while still honouring reservations is the whole point.

**Read `docs/TECH_DEBT.md` § the capacity-profile entry before designing any new reservation.** T4
surfaced, and orchestration independently verified, that the default profile declares
`'non-archived-tasks': 1000` beside `'resident-payload-bytes': 64 * MiB`, while each registration's
closeout already reserves 7 update categories × 64 KiB = 448 KiB — so the 147th registration is
refused. The two published defaults are mutually unreachable by roughly 7×.

**T5 does not fix this** — it belongs to T1/T3's reservation model and T8's profile qualification.
But T5 **adds reservations**, so:

- Do not silently increase the per-task reserve without saying so.
- If a new reservation changes that arithmetic, **state the new per-registration total and the new
  effective task ceiling in `result.md`**, and amend the TECH_DEBT entry's arithmetic in your PR.
- If the A3 requirements turn out to be *unimplementable* under the current profile rather than
  merely tight, **stop and surface it** — that converts a P2 into a blocker on this slice, and it
  is the orchestrator's call, not yours.

## You still hold licence to revise T1's vocabulary — with two accumulated constraints

T1's unions were predictions, `ts-agent-tasks` is on the active-development list, and **nothing has
reached `release`**. If a member is wrong for what the authority model actually needs, change it and
update T1's declared-vs-exercised table.

- **T3's constraint:** a revision that changes a *persisted* shape is a storage-format change. It
  needs a migration story or a clear statement that no persisted record carries the member. Say
  which, in `result.md`.
- **T4's constraint, new for you:** T4 built resident indexes keyed by this vocabulary. A revision
  that changes an indexed member changes an index shape, so it also needs a rebuild story — and
  `rebuildIndexes()` is the path that has to produce it.

## Package surface

`libraries/ts-agent-tasks` only — broker and implementation packlets, their types, converters and
tests. Plus this stream's artifacts, and `docs/design/agent-tasks/implementation-plan.md`'s **T5
status line only**.

## Out of scope

- **`libraries/ts-res/`, and every package outside `ts-agent-tasks`.** `ts-agent-tasks` depends only
  on `@fgv/ts-json-base` and `@fgv/ts-utils`; if you find yourself editing either, stop and surface
  it rather than absorbing the change.
- **Tools.** The plan is explicit: *tools are not required yet to exercise the authority contract.*
  The ai-assist tool factory is I1. Building it here widens the slice and delays the gate.
- **Source adapters, commands and reconciliation** — T6. **Subscriptions, receipts and
  acknowledgement** — T7. **Retention and backpressure** — T8.
- Any other stream's section in `docs/WORKSTREAMS.md` or `LIBRARY_CAPABILITIES.md`.
- **Do not fix `ts-utils`'s `isKeyOf`** (see carried-forward questions).

## Tests — the plan's list is the specification

Exhaustive tracked transition table; duplicate/no-op mutation; self, cyclic and missing parents;
cross-source children; empty/manual/automatic lists; hidden and partial children; policy revocation
between check and commit; foreign IDs; fabricated principal/scope filters; projector failure without
full-data fallback. Concurrent A→B versus stale A write; no implicit child reassignment; no
artifact/visibility grant; source lookup still targeting the original actor-local store. Crash
before list completion with rebuild-and-recheck on reopen; unresolved child prevents completion;
terminal/archived edge immutability; parent resolution through tombstones.

**This slice's evidence is adversarial tests, not counters.** T4's counter discipline was for a
performance gate; do not import it here. But T4's *measurement* rule still applies if you touch the
M1 harness: heap and RSS claims belong to M1 only.

## Repo gates

- [ ] `rushx build` **zero warnings** in every modified package — a warning is a CI failure
- [ ] `rushx lint` (**not** transitively run by build), `rushx fixlint` before the final commit
- [ ] `rushx test` at 100% coverage. **Remove branches that cannot execute rather than testing
      them**, and prefer that to a `c8 ignore` — T4 closed to 100% with zero directives
- [ ] Change file present — `rush change --verify --target-branch origin/integration/agent-tasks-v1`
- [ ] Repo-wide `node common/scripts/install-run-rush.js rebuild`
- [ ] Repo-wide `node common/scripts/install-run-rush.js test` — a widened *accepted set* moves no
      signature and a rebuild cannot see it
- [ ] `verify-capability-docs.mjs`, `generate-capability-feed.mjs --check`, `verify-esm-entrypoints`,
      `verify-bundler-resolution`, `verify-tarball-exports`
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] `code-reviewer` **before** coverage closure, findings resolved or dispositioned in the PR
- [ ] Copilot loop driven to diminishing returns or the cap, with the stop reason stated

**If the local suite reports a failure in a package you did not touch, read the log before
concluding it is flaky.** Two such claims in this cluster's history were environment-level and
real — a `rush install` dependency fetch that times out and is not retried, and an Argon2id test
whose mock derives colliding keys from distinct salts about 1 run in 7,000. Both are recorded. A
third claim that "it did not reproduce" without a log is not a disposition.

## Traps this stream's predecessors paid for

1. **An evidence run is only evidence of the code it was run against.** T3's mutation matrix ran
   against an intermediate head; re-run on the final source, **nine rows turned nothing red, five
   of them real gaps.** If you produce evidence and then take review findings, **re-run it before
   you claim it.**
2. **A bounded array whose entries carry an identity needs a uniqueness constraint, not just a
   length cap.** T1 hit this three times in one loop.
3. **A test comparing a constant to a constant looks like a guard and is not.**
4. **A review round that posts zero comments is not evidence of a clean diff** — read the summary's
   "previously missed" block, not the comment count.
5. **A finding that lives only in a PR body or a stream artifact is a finding you are throwing
   away.** T4's capacity discovery had to be lifted into `TECH_DEBT.md` at orchestration time. If
   you surface something that outlives this slice, put it somewhere durable **in this PR**.
6. **Fix the class, not the flagged line.** Three separate review rounds in this repo this week
   flagged one instance of a staleness that turned out to be wider. When a finding lands, ask what
   made it true, not how to make that line agree with itself.

## Open questions, none T5's to settle alone

1. **Executor-payload dereference** — may terminal presentation dereference an executor-owned
   payload after the broker update is acknowledged? A §8.3 / **T6** / **T8** decision, still
   unanswered and still carried to the design authority. It reached none of T1–T4. **T5 is the
   first slice that plausibly touches it**, since terminal outcome and audiences are yours. If it
   reaches you, **stop and surface it — do not decide it.**
2. **Source-history spelling.** §5 says `'latest-snapshot' | 'replayable-updates'`; §1 and §8.6 say
   `'observed-state'` / `'source-replay'`. T1 unified on §8.6; **T6** confirms.
3. **`ts-utils` `isKeyOf`** calls `item.hasOwnProperty(key)` rather than
   `Object.prototype.hasOwnProperty.call(...)`. Escalated by T1, still unfixed, still **not** to be
   folded into this slice.

## Exit artifact

`result.md`, opening with a one-line `**Shipped:** …` statement. It must record:

- Which authorization shape you built (checks at every boundary versus a sanitizing wrapper) and why.
- Every T1 vocabulary revision, with its persisted-shape and index-rebuild answer.
- Any change to per-task reservation arithmetic and its effect on the effective task ceiling.
- Anything that belongs to T6/T7/T8, routed durably rather than left in the artifact.

Keep `state.md` current as you go: what is done, what is open, the next concrete step. If the
session crosses a context boundary, `state.md` plus this brief must be enough to resume cold.

## Required reading, in order

1. This brief.
2. `docs/design/agent-tasks/implementation-plan.md` § T5, and § A3 in § 1.
3. `docs/design/agent-tasks/development-design.md` — the authority, scope and projection sections.
4. `.ai/tasks/active/agent-tasks-t4/result.md` and `brief.md` — what the index and repository
   actually provide you, and the decisions T4 recorded.
5. `.ai/tasks/active/agent-tasks-t3/result.md` — the record and commit model you are brokering over.
6. `libraries/ts-agent-tasks/src/packlets/storage/` — `repository.ts`, `openRepository.ts`,
   `taskIndex.ts`, `queries.ts`, `projection.ts`.
7. `docs/TECH_DEBT.md` § the capacity-profile entry.
8. `.ai/instructions/CODING_STANDARDS.md` § *Review-loop discipline* and § *Pre-PR validation*.

## Missing-input rule

If any file above does not exist, or a plan section does not say what this brief claims, **STOP and
surface the gap.** Do not reconstruct the intent from surrounding code and proceed — a brief that
has drifted from the tree is a signal worth reporting, and the integration branch moved under this
stream when `release` was merged up.
