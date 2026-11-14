# State — `agent-tasks-t5`

Resume by reading `brief.md`, then this file newest-entry-last.

---

## 2026-09-23 — kickoff: inputs verified, design fixed

**Missing-input check.** Every required-reading file exists. Branch `claude/agent-tasks-t5` at
`e9f5f311` (the stream-open commit) over `536858eb`. The plan's § T5 and § A3 say what the brief
says. The storage packlet is as T4's result describes: `FileTreeTaskRepository` with
`withWriter`/`register`/`commit`, resident `TaskIndex` (child adjacency for every retained task,
archived included, with final status), `query`/`queryDue`/`listOwed`/`lookupSource`, staged
rebuild. No broker, no transition policy, no authorization anywhere. T1 registered **no** tracked
command handles (names only), so parameter shapes are T5's.

### Authorization shape — the decision the gate is about

**Checks live at every boundary, and the view cannot produce unprojected data.**

1. A host binds a view: principal key, maximum scope selectors, `ITaskAuthorization`
   (`check(request)` + `policyEpoch()`), optional projector. Request types carry **no** principal
   or scope field, and every request converter is strict — a fabricated `principal`/`scopes`
   property is `invalid`, not ignored.
2. Two separate objects: `bindView` returns a read-only view (query/inspect only — no mutation
   method exists on the object); `bind` returns the writer. A tool handed the view cannot write.
3. **Read path.** A task is visible iff (a) one of its scopes is in the view's selectors and
   (b) `check({action:'read'})` is true. The view's only outputs are *projected* types
   (`IProjectedTaskEnvelope` has no `binding` member; details only through a host details
   projector). The pipeline is authorize → project → strict-convert the projector's output →
   identity check (id/kind/revision must match the source). A projector that throws, fails, adds a
   `binding`, or substitutes another task **fails the call**; there is no code path that returns
   the source envelope instead. Authorization failure/throw is a denial (fail closed).
4. **Mutation path.** Each operation authorizes its subject — and for relationships each
   affected parent, with a `role` — against a snapshot, then, inside one serialized writer
   section, re-reads every record it authorized, refuses if any semantic revision moved or the
   policy epoch changed (`conflict`, retry `safe`), and only then evaluates graph rules and
   commits. Authorization is not a wrapper around the operation; it is data the operation carries
   into the gate and re-verifies there.
5. Foreign and hidden ids give the same code **and** message. A refused relationship never names
   a hidden previous parent. Query pages drop denied candidates before inclusion, report no
   counts, pass no repository `issues` through (they name quarantined ids), and omit `generation`
   (a repository-wide change counter is a side channel). Cursors are view-held handles bound to
   the view instance and policy epoch.

### Serialization

The repository refuses a concurrent `withWriter` (`conflict`/`safe`). The broker runs every
mutation's gated section through one bounded FIFO (64 waiting; beyond → `conflict`/`safe`), so
concurrent broker calls are ordered, not refused, and the stale one fails on its revision.
Authorization runs outside the queue; the gated section re-verifies it. Cycle checks run inside
the gate against the current graph (storage `_checkParent` already does, and broker graph rules
run beside it in the same section).

### Updates and audiences

Updates are planned for every semantic change (category per change) with audience = subscriptions
matching before ∪ after. **There are no subscriptions until T7**, so the audience resolver is an
internal seam defaulting to none, and **an update owed to no one is not retained** (it can never
become owed later: a new subscription starts from a baseline, never back-history). So T5 writes no
update payloads in production and adds no update/payload growth; tests inject a resolver through
the internal module to pin categories, `required`, snapshots and before∪after audiences.

### A3 — reservations

T5 adds **no new reservation**. Native tracked commands commit in one step (no dispatch, so no
settlement claim); terminal transitions and list completion spend the task's existing
`terminal-closeout` claim (storage already spends it on the non-terminal→terminal step and
consumes it at archive); metadata operations carry claims forward untouched. Per-registration
total stays 7 × 64 KiB = 448 KiB of `resident-payload-bytes`; the effective ceiling stays 146.
Tests: saturation rejects new identities while same-key replay, list completion from accepted
children, terminal completion and archive still succeed; per-task operation holdback keeps the
closeout's two slots.

### Other decisions

- **Lists** accept `fail`, `cancel`, `set-*`; `succeed` only through `completeList` (explicit) or
  the pump, both of which check the complete authoritative child set. `start/wait/pause/resume`
  on a list are `unsupported` (no own work; stop semantics are T9's).
- **Completion candidates** are an index structure (per-parent succeeded-child count vs child
  count, automatic open lists only), patched on every commit and rebuilt from records by
  open/`rebuildIndexes`. The automatic flag is read from list details when the record is indexed.
  `ITaskRepository` gains `childStates(parentId)` and `listCompletionCandidates({after, limit})`
  — a widened shared contract: repo-wide rebuild + conformance checks.
- **Rejected command receipts** evaluated against a live task are persisted as evidence
  (table `invalid-transition`, `unsupported`, stale `conflict`). Not persisted: `denied` (a
  principal without command authority cannot consume a task's capacity), `idempotency-conflict`
  (the key already holds evidence), and `invalid-transition` on an archived tombstone (a tombstone
  takes no write, so the key stays free). Command authority is always decided first — *corrected
  after layer-1 review P2 #1*, which found the archived refusal short-circuiting it.
- **Changed since authorization** → `conflict` failure, never a persisted rejection.
- **Unresolved records** take no catalog change (`unsupported`), per design §8.3.
- **Terminal**: responsibility and scopes may change; title/description/progress/attention and
  edges may not. Archived: nothing changes (storage already refuses).
- **Graph rules**: no parent change for a terminal child; no attach to / detach from a terminal
  or archived parent; no unresolved parent; parent must exist; no self/cycle.
- **`changeScopes`** is `{ add?, remove? }`, each scope within the view's selectors — replaces the
  design sketch's full list, which would require a principal to restate scopes it cannot see.
- **Reassignment result** carries `updateIds` (possibly empty), not a single `updateId`.
- Out of scope: stops (T9), external command dispatch/observation application (T6),
  subscriptions/receipts (T7), archive eligibility beyond "terminal and owes nothing" (T8).

### Next step

Implement types + converters, `implementations` (transition table, list policy, update planning),
storage index additions, `broker` packlet; then tests from the plan's list.

---

## 2026-09-23 — implementation and scenario tests in; layer-1 review running

**Done.** Types (`authority.ts`, `broker.ts`, `trackedCommands.ts`), `brokerConverters`,
`implementations` packlet (transition table, list policy, update planning, envelope-field
helper), storage additions (`childStates`, `listCompletionCandidates`, candidate index with a
per-parent succeeded-child count, automatic-list flag read from details at index time), `broker`
packlet (TaskBroker, bound view/writer, access context, projection, catalog-mutation pipeline,
commands, creation, reads, pump, writer queue, view cursors). Docs: package CAPABILITIES broker
section, README, index row + one shortcut, T1 table notes, change file. Conformance: two new
checks + negatives.

**Decisions taken while implementing (beyond the kickoff list).**
- `null` removed from every request shape (`@rushstack/no-new-null`, and no rule disables):
  `responsibility: IResponsibility | 'unassigned'`, `parent: { taskId } | 'root'` (tagged so no
  task id can be read as the root), patch `clear: ['description' | 'progress']`,
  `set-description`/`set-progress` with the value omitted clear it.
- `ITaskAccessRequest.task` is an envelope-only `ITaskSummary` (design sketched `ITaskSnapshot`),
  so policy runs on resident data and never sees details; `role` added.
- Page `issues` from the repository (which name quarantined ids) collapse to one generic line.

**Tests so far** (all green): transition table 7×11 exhaustive + patches; authority (hidden vs
foreign identical on 8 entry points, scope/policy both required, fail-closed policy, fabricated
principal/scope filter, projector failure ×5 + details, revocation between check and commit,
cursor binding/eviction/epoch); hierarchy (self, cycle, concurrent cycle via an untouched task,
terminal/archived edges, tombstone anchoring, cross-source); reassignment (preservation,
no child reassignment, no grant, source lookup, observation-only external, A→B vs stale A for a
patch and a command, concurrent same-key replay); commands; updates via the internal audience
seam; lists (empty/manual/automatic, hidden/partial children, in-writer membership recheck,
nesting, reopen/rebuild candidates); capacity (non-archived, retained, per-task holdback,
resident-payload saturation with protected terminal); real-process crash (killed after success
returned, after rename, before rename).

**Next.** Take layer-1 findings → coverage closure (faulty-repository tests for the defensive
in-gate branches) → gates → result.md → PR into `integration/agent-tasks-v1`.
