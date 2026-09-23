# Result — `agent-tasks-t5`

**Shipped:** `TaskBroker` — principal-bound views and writers over T4's indexed repository, with
authorization re-verified inside the serialized writer on every mutation, projected views that fail
closed, the `fgv.tracked@1` transition table, task lists completed from their complete
authoritative child set (explicitly, or by a host pump over a rebuilt candidate index), hierarchy
integrity, and reassignment that changes responsibility only. No new capacity reservation.

**T5 does not close the stream.** Artifacts stay in `.ai/tasks/active/agent-tasks-t5/`; this family
finalizes at cluster close. Written 2026-09-23.

---

## What shipped

- **`TaskBroker.create({ repository, environment })`**, `bind(params)` → `IBoundTaskWriter`,
  `bindView(params)` → `IBoundTaskView` (a separate object with no mutation method), and the
  trusted host operation `registerExternal(principal, request)`.
- **Bound reads:** `query` (the view's scopes, narrowing filters only) and `inspect` (archived
  included), both producing projected data only.
- **Bound writes:** `execute` (tracked/list commands), `createTracked`, `createTaskList`,
  `updateTracked`, `reassign`, `changeScopes` (add/remove within the view), `reparent`,
  `completeList`, `archive` (terminal and owing nothing), and `reconcileListCompletions` (the pump).
- **`implementations` packlet:** `evaluateTrackedCommand` / `applyTrackedPatch` /
  `availableTrackedCommands` (the transition table), `checkListCompletion`, `planUpdates` with the
  `TaskAudienceResolver` seam, `withEnvelopeFields`.
- **Storage:** `ITaskRepository.childStates(parentId)` and
  `listCompletionCandidates({ limit, after })`; the `TaskIndex` keeps a per-parent succeeded-child
  count and a candidate set, patched by every commit and rebuilt by open/`rebuildIndexes()`. The
  automatic-list flag is read from list details when a record is indexed (details are never
  resident). Two conformance checks and their negatives.
- **Converters:** `buildBrokerConverters` (strict request converters with no principal or scope
  member, receipts, projected shapes, typed tracked-command parameters).

## Authorization shape — which one was built, and why

**Checks at every boundary, re-verified in the writer; and a view that cannot emit unprojected
data.** Not a sanitizing wrapper.

1. **Every operation authorizes at the point it holds the record**, through one `AccessContext`
   per binding. Visibility = one of the task's scopes in the binding's selectors **and**
   `check({ action: 'read' })`. A mutation then checks its action on the subject and, for a
   relationship, on each affected parent with its `role` (`parent`, `previous-parent`,
   `new-parent`). The policy is told the target responsibility and proposed scopes.
2. **Nothing between check and commit is trusted.** `policyEpoch()` is captured before the checks.
   Inside one serialized writer section (a bounded FIFO in front of the repository's single
   writer), the operation re-reads every record it authorized and refuses (`conflict`, retry
   `safe`) if the epoch moved or any semantic revision changed, then evaluates graph rules and
   commits. The cycle check is storage's, in the same writer section, against the current graph.
3. **Projection is structural.** A view's output types are projected types:
   `IProjectedTaskEnvelope` has no `binding` member, and the projector's output is strictly
   converted and identity-checked (same id, kind, detail version, revision). A projector that
   fails, throws, adds a field or describes another task **fails the call**; there is no code path
   that returns the source envelope instead. Details appear only through a host
   `ITaskProjector.details`. A read-only view is a different object with no mutation methods.
4. **No leaks through the edges.** A hidden task and a foreign id give the same code and
   message on all eight entry points (tested). A refused reparent never names a hidden current
   parent. Pages drop denied candidates before inclusion, count nothing, carry no repository
   generation (a change counter over hidden work), and reduce repository `issues` (which name
   quarantined ids) to one generic line. Cursors are view handles bound to the view instance and
   policy epoch. A failing or throwing policy check is a denial, reported to the host logger only.

Why this shape: design §6 requires revalidation because checks are async, and the brief asks that
authorization not live in a wrapper a refactor can route around. Here the authorization facts
(epoch, authorized revisions) are data the operation carries into the writer and re-proves there.

**What is structurally guaranteed and what is the host's (layer-1 P3 #4).** The binding and
details are structurally excluded. Outcome artifact references are removed by
`defaultTaskProjector` only: a host projector that keeps them is making a disclosure decision the
strict converter cannot distinguish from a legitimate one. Documented in `CAPABILITIES.md`.

**The one unbound operation (P3 #3).** `TaskBroker.registerExternal` takes a principal key and no
authorization, by design (design §7: "trusted host registration only"). Hand principals a bound
writer, never the `TaskBroker`.

---

## The acceptance items, and the evidence for each

| acceptance | evidence |
|---|---|
| parentage, responsibility, visibility, authority independent | reassignment changes only responsibility + revision/`changedAt`/operation (field-by-field diff test); scopes change only by `changeScopes` within the view; parents grant nothing; responsibility grants nothing (bob's view still cannot see the reassigned task); policy asked per action and role |
| one writer rejects stale updates | `A→B` reassign racing a stale `A` patch: reassign commits, patch fails `expected revision 1, found resolved revision 2` (`reconcile-first`); a stale command in the same race fails "changed after authorized" and is **not** recorded |
| parent changes serialized against cycle checks | a cycle formed through a task neither move touches (`z` under `y`; concurrently `y`→`x` and `x`→`z`) is refused by the in-writer cycle check; a move whose new parent changed after authorization is refused by revalidation |
| list completion uses the complete authoritative set | hidden, archived, unresolved children all counted; a child added after the pump authorized is caught inside the writer (reverting the recheck turns 5 tests red) |
| crash after last child success, before list completion | real child process `SIGKILL`s itself after the success returned, after the record's rename, and before it; reopen rebuilds the candidate and the pump completes the list (or, before rename, nothing is a candidate and the retried command applies once) |
| unresolved child prevents completion | tested (`1 child task(s) have not succeeded`, no id) |
| terminal/archived edge immutability; tombstone parent resolution | terminal child keeps its parent; terminal parent keeps and takes no children; archived tombstone refuses every change yet anchors its children and reports its final status |
| reassignment preserves id, path, children, scopes, results, source binding | tested byte-for-byte on the record, plus claims and prior evidence |
| no implicit child reassignment; no artifact/visibility grant | tested |
| source lookup targets the original actor-local store | `lookupSource(binding)` returns the same task after reassign; binding unchanged |
| observation-only external registration permits authorized catalog reassignment | the task refuses commands (`unsupported`) and accepts `reassign` |
| exhaustive tracked transition table | 7 statuses × 11 commands, each cell written from design §5 |
| fabricated principal/scope filters, foreign ids, projector failure, revocation | the authority suite |

**Revert check.** Eight protections were each reverted and rebuilt; every one turned its tests
red (in-writer epoch check 2, related-revision check 2, projector identity check 1, in-writer list
recheck 5, command authority before the archived refusal 1, default binding strip 3, hidden
parent naming 1, query denial 4). Run on the final source.

---

## T1 vocabulary: revisions, persisted shape, index rebuild

**No T1 member was revised, and no persisted shape changed.** Catalog requests and receipts are
still stored as validated JSON in `IStoredCatalogOperation` (T3's shape); T5 adds typed converters
for them. Command evidence uses T3's `IStoredCommandOperation` unchanged. **No migration** — every
record T1–T4 wrote is read unchanged.

**Index shape widened** (T4's constraint): the candidate set and succeeded-child counts are derived
in memory, never persisted, and `rebuildIndexes()`/open reconstruct them from the records (tested:
reopen and rebuild both produce the candidate).

Decided, not revised (each noted in T1's table):
- `TrackedTaskCommandName` got its parameter shapes (`TrackedCommand`). Not registered as kind
  command handles — the tool/wire schema is I1's.
- `CommandRejectionReason`: **`idempotency-conflict` is the rejected receipt for a reused command
  key** with a different request or principal; a reused catalog key is a `conflict` failure.
- `TaskListCompletion`: settled with no sub-modes.
- `UpdateCategory` mapping: title/description → `progress`; scope changes → `relationship`.

New T5 vocabulary: `TaskAction` (14), `TaskAccessRole` (4), `TaskMutationDisposition` (2), and the
request/receipt/projection interfaces. Deviations from the design's sketches, all recorded:
- `ITaskAccessRequest.task` is an envelope-only `ITaskSummary`, not `ITaskSnapshot`, so a policy
  decides from resident data and never sees details; `role` added.
- `null` removed from requests (`@rushstack/no-new-null`; no rule disabled):
  `responsibility: IResponsibility | 'unassigned'`, `parent: { taskId } | 'root'` (tagged so a task
  id can never be read as the root), patch `clear: [...]`.
- `IChangeTaskScopes` is `{ add?, remove? }` within the view's selectors, not a replacement list.
- `IReassignmentResult` carries `updateIds`, not a single `updateId`.
- The page type omits `generation`.

---

## A3 — reservation arithmetic

**T5 adds no reservation and changes no charge.** Native commands commit in one step (no dispatch,
no settlement claim). Terminal transitions and list completion spend the task's existing
`terminal-closeout` claim; archive consumes it; metadata operations carry claims forward
byte-identical (tested). **Per-registration total unchanged: 448 KiB of `resident-payload-bytes`;
effective default ceiling unchanged: 146 concurrent non-archived tasks.** `docs/TECH_DEBT.md`'s
entry stands as written.

The requirements are implementable under the current profile, not merely tight. Tested at
saturation: non-archived full (new identities refused; same-key replay, child completion, list
completion and archive proceed; archive reclaims a slot); retained identities (lifetime, not
reclaimable); per-task operations (ordinary work stops two slots short; terminal and archive use
them); **resident payload exactly full** (a new identity and an ordinary owed progress update are
refused; the terminal transition's owed lifecycle and result payloads come out of the task's own
closeout reservation and are accepted).

**Updates owed to no one are not retained.** With no subscriptions until T7, an update's audience
is empty and nobody could ever acknowledge it (a later subscription starts from a baseline, never
back-history), so T5 writes no update payloads in production and adds no update growth. The
`TaskAudienceResolver` seam is internal (`TaskBroker._create`); tests use it to pin categories,
`required` and before ∪ after audiences.

---

## Open questions

1. **Executor-payload dereference — did not reach T5, and T5 decided nothing.** Terminal outcome
   is an `ITaskOutcome` (a bounded summary plus reference identifiers); the broker never
   dereferences a reference, the default projection removes artifact references, and an update's
   presentation is the bounded envelope frozen with its revision. Whether terminal presentation
   *may* dereference an executor-owned payload after acknowledgement remains with §8.3/T6/T8.
2. **Source-history spelling** — not named anywhere in T5.
3. **`isKeyOf`** — not touched. Every broker converter input is a caller object or parsed JSON.

---

## What a later slice must decide (also recorded in `docs/TECH_DEBT.md`)

1. **T7 — replace the audience seam with subscription matching, and reserve before it.** Once
   updates have audiences, each accepted update must reserve its per-audience acknowledgement
   evidence (§8.6 allocation 2) before acceptance. The seam today writes audience links with no
   such reservation; it is internal precisely so no host can use it before T7 adds that.
2. **T8 — archive eligibility.** T5 archives a terminal task only when no retained update has a
   non-empty audience (`retention-blocked` otherwise). T8 replaces that with acknowledgement /
   disposition evidence and prunes satisfied payloads.
3. **T6 — external commands.** An external task's commands are `unsupported` and recorded under
   their key today; T6's dispatch replaces that. Rejected evidence recorded under a key before T6
   stays valid (a retry uses a new key).
4. **T9 — `stop-active`, stop admission.** No stop exists; list completion and relationship
   operations will need the latch check.

---

## Layer-1 review

`code-reviewer` on the full diff before coverage closure: **no P1**.
- **P2 #1 (fixed):** `execute` returned `invalid-transition` for an archived task *before*
  checking command authority, so a principal without it learned the task's state, and `state.md`
  claimed every `invalid-transition` was recorded. Authority is now decided first (test added;
  revert turns it red), and the docs state the split: a tombstone's refusal cannot be recorded
  because a tombstone takes no write.
- **P2 #2 (applied):** the exit artifact describes the actual split — above.
- **P3 #3, #4 (dispositioned above):** unbound `registerExternal`; artifacts are the projector's.
- **P3 #5 (kept):** `inspect` reads the record for visibility and again for the typed snapshot;
  visibility is decided against a record that existed, and the second read cannot widen it.
- **P3 #6 (kept):** `execute` converts parameters before the replay check because the replay
  compares the stored, converted request.

**Coverage closure, after review.** 100% statements, branches, functions and lines, **no
`c8 ignore`**. Removed rather than tested: a JSON conversion of broker-built receipts that could
not fail (now a field-by-field builder), an unused cursor-table getter, an unused capacity detail
on broker failures. The rest got behaviour tests, including a misbehaving injected repository
whose in-writer reads fail, vanish or change type — the broker checks what an injected repository
returns rather than assuming it.

---

## Gates

Every step `.github/workflows/ci.yml` runs, run locally on the final source:

| gate | result |
|---|---|
| `rush change --verify --target-branch origin/integration/agent-tasks-v1` | change file found |
| `rushx build` (package) | clean, **zero warnings**; `etc/ts-agent-tasks.api.md` updated and checked in |
| `rushx lint` / `rushx fixlint` | clean; fixlint run before the final commits |
| `rushx test` (package) | **1,140 passed; 100% statements, branches, functions, lines; no `c8 ignore`** |
| `rush rebuild` (repo-wide) | exit 0, no warnings — required: `ITaskRepository` gained two members |
| `rush test` (repo-wide) | exit 0, 37 projects — required: a widened accepted set is invisible to a rebuild |
| `verify-capability-docs.mjs` | router 20,016/24,000, 24/24 documented, 75 reflexes, 0 failed |
| `generate-capability-feed.mjs --check` | 0 stale |
| `verify-esm-entrypoints.mjs` | 24 checked, 0 failed |
| `verify-bundler-resolution.mjs` | 20 checked, 0 failed |
| `verify-tarball-exports.mjs` | 26 packages, 205 paths, 0 failed |

**Layer 2 (Copilot) is driven on the PR**; its record is appended below as it happens.

### Copilot round 1 — 1 high, 1 medium, 1 low; all real, all fixed as a class

| finding | fix |
|---|---|
| **(high)** child creation captured the policy epoch *after* the parent's visibility/authority checks, so a policy change during a parent check was invisible to the in-writer recheck | fixed for **every** operation, not only creation: the epoch is captured before the first question is put to the policy (catalog pipeline, commands, creation). Tests: an epoch bumped during a parent check refuses the creation; one bumped during the visibility check refuses a mutation. Reverting the creation fix turns 2 tests red |
| **(medium)** the catalog pipeline ran admission (unresolved, archived, not-a-list, stale revision) before `may(action)`, so a principal with read but not the action learned mutation-specific facts — the same class layer-1 P2 #1 found in `execute` | authority is now decided before anything action-specific in the catalog pipeline, commands (unresolved included) and creation (before scopes and parent checks). Test: a reader without any action gets `not permitted`/`denied` from an archived, unresolved, non-list or stale target. Reverting turns 2 tests red |
| **(low)** `docs/WORKSTREAMS.md` still said T5 was not started | the T5 entry now carries the shipped marker for #691, anticipating merge per the artifact protocol |

The layer-1 P2 and Copilot's medium are one defect class found twice: an ordering in which a
refusal can disclose state before authority is decided. The fix is now uniform across entry points.
Package after the round: 1,143 tests, 100% on all four metrics, lint clean.

### Copilot round 2 — 6 high, all real; one class (replay) plus one sibling (inspect), fixed as a class

| finding | fix |
|---|---|
| catalog replay re-authorized without the operation's access context (a policy deciding on the target decided the replay differently) | `replayCatalog` passes the same `access` (target responsibility, proposed scopes) the operation was first authorized with |
| catalog, command and creation replays returned the stored receipt without the in-writer revalidation a commit gets — a policy change or a record change after authorization went unseen (3 findings) | every replay path now ends in `confirmUnchanged`: inside the writer, the policy epoch and the record's semantic revision must be what the replay was authorized under, else `conflict`/`safe` |
| a replay discovered *inside* the writer (the same operation committed while this one waited) was authorized against the pre-writer snapshot (2 findings) | the writer section now returns a restart marker and the operation re-runs from the top, reaching the ordinary replay path against the record as it is now |
| `inspect` never captured or rechecked the policy epoch | bracketed: captured before the first policy question, rechecked before returning, for resolved and unresolved tasks |

Tests: a target-restricted policy replays; a replay after the task left the view is not found; a
policy change during a replay's authorization withholds the receipt for catalog, command and
creation replays; a record change during it does too; a policy change during an inspection fails
it. Revert checks: removing the catalog confirmation (2 red), the access context (1), the command
confirmation (1), the inspection recheck (1). Package: 1,149 tests, 100% on all four metrics.

Follow-up pinning tests (before the thread replies were resolved). The first replies named tests that
existed only in part, so two were added: a same-key operation that committed while this one waited, with
the task then hidden from the caller, is not found on both the catalog and command paths (turns red if the
catalog path replays the pre-writer snapshot instead of restarting); and command and creation replays whose
task changed after authorization withhold the receipt (turns red with `confirmUnchanged`'s revision check
removed). The target-restricted replay is pinned only in the allow direction: a different target under the
same key is an idempotency conflict, rejected before the policy is consulted. Package: 1,151 tests, 100%.

The finding profile is still substantive (real disclosure paths), so the loop continues.

### Copilot round 3 — 5 high, all real; three classes

| finding | fix |
|---|---|
| a `reparent` replay re-authorized the subject only, never the parent it moved to (2 findings: catalog and creation) | a catalog mutation declares `replayRelated`, the tasks its **request** names; a replay reads and authorizes each in its role and `confirmUnchanged` re-reads them in the writer with the subject. `reparent` names the new parent; a creation replay authorizes `parentId` in the `parent` role. The previous parent of a move is in neither the request nor, after the commit, the record, and the receipt says nothing about it, so it is not re-authorized. This is a stated limit, not an oversight |
| the pump's key `complete-list-r<rev>` could already hold a caller's operation (an unchanged operation records its id without moving the revision), so the list was skipped on every pass forever | the key is the first free one in a fixed sequence (`…-r<rev>`, `…-r<rev>-1`, …), bounded by the record's operations. A concurrent pump that commits the same key first is answered by the pipeline's in-writer restart and replay |
| the projector (and, by the same reasoning, the policy) was handed the resident index's own objects, so host code could mutate broker state without a commit | the policy receives a `structuredClone` of its request, and the envelope and details projectors a clone of their input |
| `inspect` authorized one read and returned a second (`repository.read`), which could be a newer record | the typed read is returned only if it is the authorized record, meaning the same registration state at the same semantic revision; otherwise `conflict`/`safe` |

Tests: replays of a move are withheld when the new parent is hidden or `reparent` on it is denied; the same holds for a creation replay's parent; a move to root replays without a parent; a new parent changed during the replay's authorization withholds the receipt; two claimed keys, then the pump completes the list under `complete-list-r1-2`; a vandal projector and policy leave the index and the record intact; a task changed between authorization and read is not inspected. Revert checks: request-named parents on catalog replay (2 red), creation parent (1), pump key (1), projector and policy copies together (1) and the policy copy alone (1), inspect identity (1). Package: 1,157 tests, 100% on all four metrics, lint clean.

Round 3 is still substantive (the pump-key finding is a liveness bug; the others are disclosure or integrity paths), so the loop continues to round 4.

### Copilot round 4 — 3 high, all one class: the in-writer epoch check sat before the section's awaits

The writer section checked the policy epoch first, then awaited re-reads, cycle-check reads and evaluation before the write. A revocation during any of those awaits went unseen. That was true of the catalog pipeline, commands, native creation and the replay confirmation.

| fix |
|---|
| `AccessContext.epochIs(epoch)`; each writer section now checks it **after its last await**, immediately before the durable write (`writer.commit` / `_commit` / `_register`, none of which awaits before writing) or before a replay's receipt is released. The check moved rather than being duplicated: one check, at the linearization point |

Test: a writer whose reads change the host policy mid-section. The catalog, command and creation (with parent) commits are each refused with nothing written, and so is a replayed receipt. Revert checks: each of the four checks disabled on its own turns 2–4 tests red. Package: 1,158 tests, 100% on all four metrics, lint clean.

Round 4 is narrower than rounds 1–3: one class, a refinement of an existing guard rather than a missing one. The loop takes one more round to see whether the profile has turned.
