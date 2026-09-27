# State — `agent-tasks-t9`

**Purpose of this file.** If the session crosses a context boundary, `brief.md` plus this file must
be enough to resume cold. Keep it current as you go.

---

## Status

**Reviews done, coverage closed; revert matrix running; PR next.** (2026-09-27.) Head `c5e4ceb7`:
85 suites, **1,968 passed / 0 failed**, 100 % on every metric, zero `c8 ignore`, lint clean,
`fixlint` no-op. Layer 1 and the semantic antagonist both ran on `e55f0d5e`; the antagonist's seven
findings (H1, M1–M4, L1, L2) are fixed in `c5e4ceb7`, each with a regression. `result.md` drafted.
Next: revert matrix on the final source (`perf/mutationMatrix.js`, T9 rows T9-1…T9-61 added) →
repo-wide rebuild/test + verify scripts → PR into `integration/agent-tasks-v1` → plan status line
and ledger entry as shipped → Copilot loop.

## Branch

- `claude/agent-tasks-t9`, cut from `integration/agent-tasks-v1` at `ea6b6f38b` — the `release`-up
  merge following T8's close, so the base carries #700 as well as T8.
- PR targets `integration/agent-tasks-v1`, **not `release`**.
- Artifacts stay in `.ai/tasks/active/agent-tasks-t9/`. This family finalizes at **cluster close**;
  do not run `/finalize-task`.

## What is on this base

| slice | landed | PR |
|---|---|---|
| T1 package, values, converters, registry | ✅ | #684 |
| T2 pure context, snapshot-only use | ✅ | #685 |
| T3 FileTree records, durable commit, reopen | ✅ | #686 |
| T4 indexed selection, paging, due/owed discovery | ✅ | #687 |
| T5 bound authority, tracked hierarchy, reassignment | ✅ | #691 |
| T6 source adapters, commands, reconciliation | ✅ | #693 |
| T7 subscriptions, exact receipts, acknowledgement | ✅ | #695 |
| T8 PR 1 retention, disposition, closure, pruning | ✅ | #698 |
| T8 PR 2 A3 journeys, M1, the capacity profile | ✅ | #699 |

Plus, from `release`: the `hasOwnProperty` null-prototype fix and `no-prototype-builtins` (#700).

**T8 is closed, so the capacity model is settled.** The default profile now admits **536 plain
registrations, bound by `logical-bytes`** — not the 1,000 `non-archived-tasks` it advertises.
That figure is pinned by a test and documented at the profile site; your saturation work inherits it.

## Verification standing at branch time

Orchestrator re-ran on T8 PR 2's final source, independently of its claims:

- `rushx test` → 72 suites, **1,791 passed, 0 failed**, 100 % on every metric, zero `c8 ignore`,
  zero warnings.
- Phase 0's figures exact: `storage/repository.ts` 1993 → **1808** at the extraction commit, with
  `etc/ts-agent-tasks.api.md` byte-identical across it. The only api.md delta across the whole PR is
  the new `maximumUpdateBytes` export.
- The 536 figure is pinned by an executable test that registers until refusal and asserts the
  refusal is on `logical-bytes`.

## A correction worth carrying, because it was the orchestrator's

The capacity table in T8b's brief said 384 MiB made 1,000 reachable "in every mix we model." It did
not: the table modelled `resident-payload-bytes` alone, and once that was raised six-fold,
`logical-bytes` became the binding dimension at 537. The information was in T7's own `result.md`
and was not carried through.

T8b caught it only because the brief told it to reproduce the arithmetic rather than trust it. **The
same instruction is in your brief, and it applies to every number there.**

## Work log

### 2026-09-27 — required reading done; no gap found

Brief, design § 10 (and §§ 4–8 where § 10 leans on them), plan § T9 / A2 row / gate row 9,
`docs/TECH_DEBT.md` T5 (4) and T6 (4) hand-offs, T5/T6/T8/T8b `result.md`. Every file exists and
each plan section says what the brief claims. Numbers reproduced from source rather than trusted:
the default profile constants in `types/capacityProfile.ts` match the 536 / `logical-bytes` claim's
inputs (976 KiB closeout per registration against 512 MiB); the executable pin is T8b's test.

### Design decisions (the working model — see result.md for the final record)

**Where the intent lives.** `IResolvedTaskCommitRecord.stops?: ReadonlyArray<IStopIntent>` on the
root's own record (design § 8.3 has `stop?: IStopIntent`; an array because § 10 says overlapping
intents are represented independently — at most one *latching* intent per mode per root). Released
and settled intents stay in the array as evidence. The intent is **not** envelope state: a stop
changes no semantic revision, and public lifecycle keeps describing the root's own execution
(§ 10 step 3: "No status field falsely represents tree-wide completion").

**Latching states.** `pending | blocked | satisfied` latch; `released | settled` do not.

**Where the freeze is enforced: storage, under the writer.** Every broker path funnels into
`writer.commit` / `writer.register`, so the repository refuses (operation-purpose commits only —
a source observation is authoritative and exempt):
- a registration whose parent is latched; a parent change of a latched task or into a latched task;
- a lifecycle move to `running`, or out of the latch's required stopped set, on a latched task;
- a new external command op on a latched task, or a marker-less op squatting on a live attempt id;
- `complete-list` on a latched list (T5 hand-off 4);
- a stop-marked op that is not a live, unlanded attempt of a latching intent (no dispatch after
  release, structurally);
- intent evolution that drops, re-identifies or forges an intent; a new intent whose targets are
  not exactly the authoritative subtree (root first, then breadth-first by id).
The latch book is part of the `TaskIndex`, so open and `rebuildIndexes` rebuild it from records
**before** the repository accepts any write. The broker also pre-checks for clear refusals
(`stop-active` receipts), but storage is the guarantee.

**Stable per-target command ids: minted and persisted, not derived.** § 10 asks for tuple encoding
of `(intent, target, mode, attempt)`; two 128-char ids cannot fit the 128-char operation-id bound.
The property that matters — the same key across restarts — comes from persisting the minted id in
the root intent before any dispatch. The target's stored command carries a `stop` marker
`{ rootId, intentId }` so a landing is recognized only when both the id and the marker match.

**Capacity (A3), derived rather than stored — the same "derived and discardable" rule the ledger
already follows.** Per target, a bundle `B` = one operation + `maxStoredOperationBytes` +
`maximumSettlementCharges` (covers a native pause/cancel commit, and an external intent commit
plus the settlement claim T6 mints for it). For each latching intent's *unlanded* attempt, the
root's ledger entry reserves `B`'s additive dimensions and the target's entry reserves `B`'s
`record-bytes` (that dimension is per record). A landing commit on the target is admitted with
both entries changed in one vector check, so it nets to zero. Root-side headroom — the intent's
maximum encoded growth plus one release operation — is also derived from the root record. The
per-task operation cap holds a slot per unlanded attempt and per latching intent's release.
Subscription delivery units add one per unlanded attempt on a covered task. Nothing here is a new
claim purpose; open recomputes all of it from records.

**Acceptance ≠ completion.** `requestStop` persists the intent with every target `unexamined` and
returns `pending`; it dispatches nothing. `reconcileStop` is the bounded host pump. Satisfaction
needs a pass that visited every target and found each `confirmed`; presentation degrades live when
a confirmed target's current record left the stopped set, and withholds `satisfied` for an intent
relying on external stable-stop evidence until this broker instance has revalidated it.

**Sources.** `ITaskSource.capabilities?` is optional: absent means nothing is stoppable
(`unsupported`). Capabilities name the stop command and its parameters (`pauseCommand` /
`cancelCommand`) instead of § 5's `commands: string[]`, because the kind registry is already the
command authority (T6) and a stop needs parameters, which a name alone cannot supply.

**Lists.** A list has no own work: as a pause target it is confirmed without a command; as a cancel
target it is cancelled.

**Deferred and routed:** explicit abandonment of a blocked cancel (§ 10 step 8 "may record") —
archive of such a root is simply `retention-blocked`.

**Revisions made while testing (each caught by a test):**
- Archived descendants would each have reserved a full attempt bundle they can never use; the book
  now funds only attempts that could still land — not landed, target not archived, target not
  confirmed. A confirmed external target that restarts is re-stopped under a *new* attempt (new
  admission). `StopBook.recount()` after open's first pass, because a root may be indexed before
  its archived targets.
- Superseding a target of a `satisfied` intent must move the intent back to `pending` (the record
  converter refused `satisfied` with an unconfirmed target).
- A terminal external target is confirmed before any source call (a source with no declaration
  must not make a terminal target `unsupported`).
- A conflict-rejected attempt refreshes the task from its source before the new attempt, or the
  new attempt would carry the same stale precondition.
- The resident book keeps a coordination projection of each latching intent (ids, keys, confirmed
  flags, encoded size) — not the full intent with its evidence (design § 7).

**Capacity figures reproduced (not trusted):** attempt bundle 643,625 logical bytes / 627,241
record bytes / 37,417 resident under the default profile; max target encoding 2,986 B, intent
framing 12,682 B (six bytes per free-text unit since Copilot round 4). Executable pin: 400 plain registrations admit a stop over at most **210** of them,
refused on `logical-bytes`. Arithmetic estimate (not pinned): a stop over an entire repository of
*n* plain tasks fits for n ≲ 325.

## Open questions for the orchestrator

_(raise here and surface, rather than reconstructing intent and proceeding)_

Two are anticipated:

1. **The M1 stop-state cohort.** The plan schedules it after T9. The harness exists and its
   prediction manifest is frozen. Adding a cohort is a harness change — say so rather than doing it
   quietly, and if you judge it belongs to P1 instead, say that.
2. **Whether the A2 semantics need a design amendment.** A2 is approved and explicit, but it was
   written before T6's sources and T8's capacity model existed. If a stop cannot be expressed within
   it, the plan's own instruction applies: *"amend the design openly rather than weaken guarantees."*

## Copilot loop (#701)

**Round 1 (on `4075b901`)** — four inline findings, all real, fixed in `638e0515` with regressions
and revert rows T9-33…T9-37: (1) the generic resolver sent a stop's command under ordinary `command`
authority → the permit is now decided by the command's marker on every path; (2) the summary's epoch
check followed the unchanged fast path → moved before it; (3) reservation products unchecked for
overflow → the bundle is yielded only when `max(2000, maxOperationsPerTask) × (bundle + framing +
target + release)` is safe, and a commit touching no stop needs no bundle; (4) storage accepted a
summary recording an unstopped target `confirmed` → refused, and the pump keeps the persisted entry
for a target that left the stopped set between visit and summary. Summary-only items: *failed
observation → supersession on a stale revision* — real, fixed in the same commit (T9-37);
*contract-version change re-confirmed silently* — no change: a confirmation is always made under the
declaration asked for on that pass and records its version, so a changed contract is re-evaluated,
not carried; *paused external target confirmed without a pause command* — no change: holding an
existing pause needs the declared stable contract, not a command, and a later restart without a
command is `unsupported`; *fixture casts an untrusted capability value* — intentional, the fixture
hands the broker unvalidated source output, which the converter under test must refuse.
Matrix rows T9-18, T9-30, T9-33…T9-37 re-run on `638e0515`: all red.

**Round 2 (on `558a807f`)** — three findings, all fixed in `e1587371`: a possibly-sent command recorded
before a latch was resendable under it (now `held`, unwritten, resent after release — T9-38); open did
not check that a latching intent names exactly its root's subtree (now blocking — T9-39); the ledger's
revert-row range was stale. Found while fixing: a raise of `maxOperationsPerTask` could make the stop
bundle unrepresentable after stops existed — `initialize` and `raiseCapacityLimits` now refuse such a
profile and a stored one blocks open when stops are held (T9-40, T9-41).

**Round 3 (on `e1587371`)** — four findings, fixed in `0d51e479`: a landed command matched on intent id
alone (now root and intent — T9-42); an unvisited target's stale entry could overwrite newer progress
(the summary now takes only visited targets — T9-43), and, found while fixing, an incomplete pass that
learned nothing withdrew a concurrent complete pass's verdict (now left standing — T9-44); an archived
record could hold a latching stop (refused by the record converter — T9-45); a forged `satisfied` —
partly fixed: storage now also requires stable-stop evidence for a non-terminal external confirmation
(T9-46) and refuses one with no lifecycle; "pass evidence" in storage declined, reasoning in the thread
(targets verifiably stopped is what satisfied means; external evidence is revalidated per broker
instance before a standing guarantee is presented).

**Round 4 (on `0d51e479`)** — five findings, all real, fixed together: a source-replay stop command lost
its marker when the feed confirmed it (T9-47); a native target whose key another operation holds stayed
`refused` forever — now superseded (T9-48), and a target key may not equal the stop's own operation id
(T9-49); command keys were unique per intent but not across a record's intents (T9-50); a registration
could carry a stop, unfunded (T9-51); free text was sized at three bytes per unit, but the encoder
writes a lone surrogate as a six-byte escape (T9-52). The last moves the figures: max target encoding
2,986 B, intent framing 12,682 B, and the pin 400 → **210** targets (was 211). Bundle unchanged.

**Round 5 (on `3fdc7560`)** — three findings, all real, fixed together: the resend path checked the
latches before queuing on the writer, so a latch installed while the resend gate waited let an
ordinary command recorded before it be resent — the gate now rechecks and holds it, and retires a
stop's command whose intent was released meanwhile (T9-53; T9-38 re-pointed to the shared
`_withheld`); storage let a raw commit release a cancel whose root is terminal — now refused per
commit, not only in `releaseStop` (T9-54); storage settled a satisfied cancel from its summary — each
target must now be confirmable (for a cancel: terminal) at the archive (T9-55). T9-42 re-pointed to
`_isOwn` (stale since round 4). All four round-5 regressions red with the fixes reverted.

**Round 6 (on `d3e62758`)** — two findings: a raw release commit could rewrite the report the released
intent keeps (target states, evidence) — storage now requires a release to change only the state
(T9-56); the ledger's revert range stopped at T9-52 (now T9-1…T9-56). Findings per round: 5 → 3 → 1
substantive.

**Round 7 (on `91c3c5d4`)** — two findings, both real ordering defects:
- `presentStop` read targets and asked the policy with no recheck, so an inspection (or a write's
  response) could describe a released latch or mix two policies. It now takes the caller's authorizing
  epoch, re-reads the root afterwards, redoes the presentation from the intent as it now stands (up to
  three times), and refuses one that spanned a policy change (T9-58, T9-59). `inspectStop` captures its
  epoch before its root visibility check. The pump, whose pass can legitimately span a policy change,
  presents under the policy standing at presentation time with the root's visibility rechecked under
  it, so its result contract is unchanged (T9-60).
- A marked command was admitted under any unlanded attempt, including a confirmed one, which holds no
  reservation. It must now be funded (`StopBook.attempt` exposes `funded`) (T9-57).
Findings per round: 5 → 3 → 1 → 2.

**Round 8 (on `d94ed0f6`)** — one finding and one "previously missed", both real:
- A presentation re-read the root but did not ask about its visibility again: a root hidden or
  re-scoped mid-presentation moves no intent and no epoch. `presentStop` now asks `sees` of the root as
  re-read and answers not-found (T9-60 re-pointed there; the pump's own pre-check became redundant and
  was removed).
- A raw settlement could rewrite the report it keeps (same-attempt target fields). Settlement now
  changes only the state, like a release (T9-61; T9-55 re-pointed to `was.targets`).
Findings per round: 5 → 3 → 1 → 2 → 2.
