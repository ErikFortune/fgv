# Result — `agent-tasks-t3`

**T3 does not close the stream.** Artifacts stay in `.ai/tasks/active/agent-tasks-t3/`. Written
2026-09-22/23.

---

## What shipped

**`FileTreeTaskRepository`** — one repository implementation over an injected `FileTree` root.
The in-memory and Node "adapters" are the two FileTree accessors that implement the F1/F2 atomic
capability. The storage packlet never imports `node:fs`, never sees a native path, and never
branches on which accessor is behind the root (`grep` over `src/packlets`: the only hit is a doc
comment saying so).

- **Factories.** `initialize` (empty root only) and `open` (existing manifest only), each taking
  `{ root, mode, environment, registry, converters?, profile? }`. `open` returns
  `{ state: 'ready', repository }` or `{ state: 'recovery-required', recovery }`.
- **Mode** `'session' | { durable: 'process-crash' }`. Durable on a root whose capability inquiry
  lacks `'process-crash'` fails `unsupported` before any I/O; nothing stronger can be requested.
- **Private single-writer coordinator.** `withWriter(action)` hands an exclusive, lifetime-bound
  `ITaskRepositoryWriter` (`readCommit`, `register`, `commit`, `raiseCapacityLimits`). Nesting and
  concurrency are refused (`conflict`, `retry: 'safe'`), never queued; a stale handle fails; no
  rollback is claimed.
- **Strict JSON storage records** — `IResolvedTaskCommitRecord` / `IUnresolvedTaskCommitRecord`,
  RFC 8785 canonical encoding. **One converter runs on the write path (over the exact record about
  to be written) and on the read path.**
- **Flat repository inventory** (`repository.json`): format, repository id, the stored capacity
  profile, and `tasks` / `consumers` / `sources` entries (`live`, or `pending` with the canonical
  request and the claims it owns). Rewritten on registration and on a limit increase only.
- **Ordered record registration**: pending entry → record → live entry.
- **One-task atomic replacement** of state + owed updates + operation evidence + claims, with
  three explicit purposes: `operation` (replay checked before preconditions), `observation`
  (deduplicated by source revision; a different projection at the same revision is `source-gap`)
  and `maintenance` (no semantic revision change, no new operation or update; may prune).
- **Inventory-backed missing-record detection** plus open-time validation of every record's
  presence, strict UTF-8 (durable), JSON, format version, strict converters, filename/ID agreement,
  claim-id uniqueness across the repository, the parent graph, and fit to the stored policy.
- **Diagnostic recovery handle** (`ITaskRecoveryHandle`: `report`, `readRaw`, `close`) that holds
  the root and writes nothing.
- **A3.** Profile persisted in the manifest; claims persisted in their owning record (pending
  entry, then task record, by the same claim ids); the derived `CapacityLedger` rebuilt at every
  open, never persisted; admission of every dimension under the writer before any write, against
  the protocol's widest state; per-record byte ceilings including reserved growth; a per-task
  operation limit that holds the closeout's two slots back; `capacityStatus()`;
  `raiseCapacityLimits` (atomic, lowering refused, preflighted against the policy it commits).

---

## T1 vocabulary: exercised and revised

T1's declared-vs-exercised table (`.ai/tasks/active/agent-tasks-t1/result.md`) carries a **T3**
note on every row T3 touched. The short form:

| set | T3 |
|---|---|
| `CapacityClaimPurpose` | **Revised 5 → 6: `first-resolution` added.** §8.6 requires an unresolved registration to reserve first resolution *and* closeout — two bundles. `maximumResolutionCharges` computes the new one. `terminal-closeout` and `first-resolution` are minted, spent and consumed for real. |
| `CapacityClaimDisposition` | **Semantics revised.** A `reserved` claim's charges shrink by what a protected step spends, so `used + reserved` holds steady across a step that stays inside its reservation; a `consumed` claim reserves nothing. T1's "disposition change, not charge change" could not express a closeout spent across two steps (terminal, then archive). `indeterminate` still has no producer; read from disk it fences all growth (tested). |
| `CapacityClaimOwnership` | Both exercised. **Settled: no third state.** Pending → live is joined on claim ids. |
| `TaskCapacityState` | **Settled as distinct.** `draining` = a dimension has no headroom; `admission-blocked` = growth fenced regardless of headroom by an `indeterminate` claim. All four produced. |
| `UpdateCategory` | **Update identity fixed as `taskUpdateId` = `<taskId>:<revision>:<ordinal>`**, collision-free when read from the right, checked on every stored update. The ordinal is now on disk, so **reordering `allUpdateCategories` is a storage-format change.** The update-id bound grew by `maxUpdateIdSuffixLength` (19). |
| `TaskFailureCode` | Exercised for real: `storage-unavailable`, `storage-corrupt`, `commit-indeterminate` (always with its operation id), `unsupported`, `source-gap`, `not-found-or-denied`, `unknown-kind-version`, `backpressure`, `conflict`, `invalid`. Still predictions: `source-unavailable`, `invalid-receipt`, `cursor-stale`, `retention-blocked`. |
| `CommandState`, `CommandRejectionReason`, `RecoveryDeclaration` | Stored, not chosen. `idempotency-conflict`'s precondition now exists (storage refuses an operation id reused with a different request, as a `conflict` failure); whether it surfaces as that rejection reason is T5's. |
| profile converter | Now also requires the combined unresolved bundle (resolution + closeout) to fit, and `maxOperationsPerTask ≥ 1 + closeout's operation slots`. |

**New closed sets T3 added:** `TaskCatalogOperationType` (11), `StoredCommandDispatch` (3),
`TaskInventoryRecordKind` (3), `TaskRecoveryIssueCode` (11).

**Source-history spelling (open question 2):** not named anywhere in T3; nothing to follow or
revise. **Executor-payload dereference (open question 1):** did not surface — storage holds task
records only and dereferences nothing. **`isKeyOf` null-prototype hazard (open question 3):** the
read path parses with `JSON.parse`, which never produces a null-prototype object, so every
converter on the storage boundary is safe from it; recorded in `layout.ts`. Not fixed, as
instructed.

### Decisions that deviate from, or sharpen, the design text

1. **Archive tombstones live in the task record only** (`archived: true`); the inventory names the
   task and does not change on archive. §8.3 says the inventory "contains … archive tombstones";
   doing both is a dual write with no atomicity between files and an inventory rewrite on a
   routine mutation, which the brief forbids introducing silently.
2. **Unknown *kind* is quarantined (advisory, never rewritten); unknown *format* or envelope
   *schema* version blocks** — the ledger cannot account for what it cannot read. "Survives a
   round trip" is tested as byte-identity after open + close.
3. **Consumer and source records are named in the inventory format now**, validated only by header
   (`formatVersion`, filename/ID). T6/T7 own their content; a pending consumer/source entry blocks
   (no T3 writer produces one).
4. **Admission is checked against the protocol's widest state**, not the settled footprint: while
   the record is being written the manifest still carries the pending entry's request and claims
   (~1 KiB more). The capacity test measures that peak rather than assuming it.
5. **Replay re-establishes the flush boundary** by rewriting the committed record and manifest
   byte-for-byte (§8.2 last paragraph), for registration, operation and observation replays.
6. **Open completes pending registrations whose record landed** (the only write open makes), and
   performs no clock read, ID mint, logging or source I/O — tested with spies.

---

## The crash-window matrix, and which guarantee each test proves

Harness (`storage/crash.test.ts`): a child process opens a real durable repository on a real
directory and `SIGKILL`s **itself** at a leaf boundary of the *N*th atomic write of one writer
call, by patching the operations object `FsFileTreeAccessors` calls through (F2's technique). The
parent reopens through the real Node path. **Run on ext4 (`/tmp`) and tmpfs (`/dev/shm`)**, 37
tests each, plus a guard that fails if the platform is Linux and the matrix would be skipped.
Predictions were written in `state.md` before the first run; **all held.** The first run's only
two reds were a harness defect (the "retry" was rebuilt from the post-commit record, so it was not
a retry) — fixed by building every scenario request from the pre-commit state.

| window (§8.4) | kill points | proves |
|---|---|---|
| **No success before the boundary** | uninterrupted child logging each leaf op | a registration returns only after write 3's directory flush; a mutation after its one write's. The acceptance criterion invisible to a passing suite, pinned as an event order |
| C1 before/during temp, before rename (pending entry) | write 1: before-open, mid-write, before-rename | nothing accepted, **nothing reserved**; orphan temp reclaimed at reopen; retry registers once |
| C2 after rename (pending entry) | write 1: after-rename, after-directory-flush | pending registration reported; **reservations survive the crash** (7 updates reserved, 1 identity used); `read` says not accepted; retry resumes with the **same claim ids**, no second charge |
| C3 temp never promoted (record) | write 2: before-open, mid-write, before-rename | same as C2; no `task-t1.json` exists — a temp is never read as a record |
| C4 record landed, entry pending | write 2: after-rename, after-directory-flush | open completes the registration; claim counted **once**; retry is a replay |
| C5 live entry not yet visible | write 3: before-open, mid-write, before-rename | same as C4 |
| C6 live, response lost | write 3: after-rename, after-directory-flush | no issues; retry replays without allocating |
| C7 mutation before rename | before-open, mid-write, before-rename | old record **byte-identical**; retry applies once (record revision 2) |
| C8 mutation after rename | after-rename, after-directory-flush | new record whole — state, owed update, operation; retry is a **replay**, record revision stays 2 |
| C9 terminal commit | all five | lifecycle, both owed updates, the operation **and the spent closeout claim** land together or not at all; `used + reserved` equals its acceptance value either way |
| C10 first resolution | all five | unresolved whole (both claims reserved) or resolved whole (identity, obligations, `first-resolution` consumed); retry of the same observation replays |
| C11 limit increase | all five | old policy or new policy, whole |
| C12 orphan temps | every before-rename/mid-write row | reclaimed at exclusive reopen; the surviving record untouched |

**Out of T3's matrix, deliberately:** source save and cursor windows, the dispatch marker (T6),
context issuance and acknowledgement (T7).

**What no test here establishes:** anything about OS crashes or power loss. The kernel keeps
running in every test, so flushed and unflushed data are indistinguishable to all of them. The
claim is `'process-crash'` on F2's qualified filesystems and nothing stronger.

---

## What was mutated, and what went red

`scratchpad/mutate.py` neuters one protection, rebuilds, runs the storage suites, records what went
red and restores. **A mutation whose pattern is absent, or that does not build, is reported
UNVERIFIED — never as "nothing went red"** (F2's lesson). Final run: all 54 re-run against the
round-4 head (d2643334), after two whose target lines had moved (M21, M34) were re-pointed:

| # | protection neutered | red |
|---|---|---|
| M1 | skip the pending-inventory write | 35 |
| M2 | mark live before writing the record | 20 |
| M3 | treat visibility `unknown` as unchanged | 3 |
| M4 | never fence | 6 |
| M5 | no operation replay (precondition decides) | 13 |
| M6 | drop the operation-superset check | 1 |
| M7 | skip the flush-boundary rewrite on replay | 3 |
| M8 | double-charge on pending → live | 26 |
| M9 | no strict UTF-8 in durable mode | 2 |
| M10 | initialize adopts a non-empty root | 2 |
| M11 | durable accepted on a session-only root | 1 |
| M12 | ledger ignores pending-entry claims | 13 |
| M13 | in-place lowering allowed | 1 |
| M14 | archive does not consume the closeout claim | 2 |
| M15 | admission never refuses on a limit | 4 |
| M16 | open does not complete a landed registration | 17 |
| M17 | open does not reclaim interrupted working files | 16 |
| M18 | terminal state not absorbing | 1 |
| M19 | committed updates mutable | 1 |
| M20 | a write failure is ignored (success before the boundary) | 3 |
| M21 | first resolution may change catalog metadata | 1 |
| M22 | open completes a pending entry whose record carries other claims | 3 |
| M23 | per-task operations: no closeout holdback | 1 |
| M24 | observation replay ignores a differing projection | 1 |
| M25 | profile admits `maxOperationsPerTask` below creation + closeout | 1 |
| M26 | `raiseCapacityLimits` skips admission | 1 |
| M27 | pending completion ignores the creation request | 2 |
| M28 | registration replay matches any operation by id | 1 |
| M29 | read-back compares the revision only | 1 |
| M30 | registry `freeze()` result ignored | 1 |
| M31 | pending entries count as live parents | 1 |
| M32 | unresolved `read` skips quarantine | 1 |
| M33 | root listing drops directories | 1 |
| M34 | open skips per-value bounds | 1 |
| M35 | replay identity omits the catalog operation name | 1 |
| M36 | bounds not re-checked after kind normalization | 1 |
| M37 | a resolved record may carry no operations | 1 |
| M38 | operation identity omits the principal | 1 |
| M39 | open does not validate record claims | 10 |
| M40 | open does not validate pending-entry claims | 1 |
| M41 | pending join by claim ids only | 1 |
| M42 | registration replay rewrites a quarantined record | 1 |
| M43 | any purpose may resolve a task | 1 |
| M44 | source revision may move outside observations | 1 |
| M45 | maintenance may change semantic state | 1 |
| M46 | pending manifest growth not counted in the ledger | 1 |
| M47 | profile fit ignores the per-record bound | 1 |
| M48 | registration may overwrite an unnamed record file | 1 |
| M49 | a claim may omit a bundle dimension | 1 |
| M50 | open accepts any first operation | 1 |
| M51 | an observation may change the catalog or archive | 1 |
| M52 | a pending retry matches on id and request only | 2 |
| M53 | a replay may report uncommitted operations | 1 |
| M54 | the manifest is rewritten without checking it | 1 |
| M55 | any task may hold a first-resolution claim | 1 |
| M56 | registration replay ignores the first-record type | 1 |
| M57 | pending entries without a record are not checked | 3 |
| M58 | a resumed registration overwrites an appeared file | 1 |

**Three findings came from the exercise rather than from the suite:**

1. **M22 went 0 red on the first run** — a real test gap. The only pending-entry integrity test used
   a *different operation id*, so the claim-id half of the join was never exercised. A test with the
   same operation and foreign claims now pins it.
2. **M4 and M17 did not build on the first attempt** and were recorded UNVERIFIED, then redone with
   mutations that build. M17 is the orphan-reclamation step; counting it from round one would have
   rested the C12 claim on no evidence.
3. The coverage refactor changed seven mutation sites; the pass was re-run in full afterwards rather
   than trusting the first run against code that no longer existed.

---

## Layer-1 review

`code-reviewer` on the diff before coverage closure returned **Requires changes**:

- **P1 (fixed)** — a profile with `maxOperationsPerTask` of 1 or 2 converted cleanly and then refused
  every registration forever: the per-task holdback needs one creation plus closeout's two slots.
  The profile converter now requires it (M25).
- **P2 (fixed)** — `raiseCapacityLimits` was the one write without admission; a raise could commit a
  manifest over its own ceiling and brick the next open. Now preflighted against the policy being
  committed (M26). **The same gap existed at `initialize`** (found while fixing it); also fixed and
  tested.
- **P3 (applied)** — a comment on `_buildRecord`'s identical-looking ternary (it narrows the union).
- **P3 (kept)** — `spendClaim` always allocates, so a transition step rebuilds the record once more
  even when nothing was spent. Harmless and bounded; not worth the special case.

**Coverage closure, after review.** 100% statements, branches, functions and lines, **no `c8
ignore`**. Most gaps were branches that should not exist, and were removed rather than tested:
`RecordStore.read` now fails on an absent file instead of returning `undefined`; `canonicallyEqual`
returns a boolean (an uncomparable value compares unequal, which every caller treats as refusal);
`taskUsage` counts bytes without a failure path (`JSON.stringify` length equals the canonical
length); the ledger always holds the manifest's entry; `state.ts` (type-only, never loaded) folded
into `openRepository.ts`. The rest got behaviour tests (`storage/edges.test.ts`).

---

## What a later slice must decide

1. **T4** — the repository reads records on demand; resident summaries and indexes are T4's. Read
   today lists the root once and caches `FileItem`s; creation re-lists, because
   `IFileTreeDirectoryItem` has **no child-by-name lookup** (an upstream gap, not escalated as a
   blocker: creation is already O(identities)).
2. **T5** — transition policy. Storage enforces only integrity (identity, evidence retention,
   update immutability, terminal absorbency, revision monotonicity). Whether a reused operation id
   surfaces as `CommandState.rejected: idempotency-conflict` or a `conflict` failure is T5's call.
3. **T6** — source records' content (`source-<id>.json` is header-only here) and the observation
   path's replay semantics (`source-gap` on one revision, two projections) need confirming against
   real adapters.
4. **T7** — consumer records' content and converters; **claim audiences are empty** in T3 because no
   subscription exists, and `acknowledgement-ids` used is 0. Subscription creation must expand
   closeout claims' audiences and reservations.
5. **T8** — pruning is `maintenance`; archive consumes the closeout claim **including its
   acknowledgement reservation**, which is safe only once T8 enforces that archive requires every
   owed update acknowledged or disposed.
6. **Format** — adding the stop intent (T9) or any other field to a v1 record is a format change a
   T3 reader refuses (blocking, bytes kept). Decide whether those land as v1 before promotion.

---

## Gates

Every step `.github/workflows/ci.yml` runs, run locally on the final code:

| gate | result |
|---|---|
| `rush change --verify --target-branch origin/integration/agent-tasks-v1` | change file found |
| `rushx build` (package) | clean, **zero warnings**; `etc/ts-agent-tasks.api.md` updated and checked in |
| `rushx lint` / `rushx fixlint` | clean; fixlint run before the final commit |
| `rushx test` (package) | **774 passed; 100% statements, branches, functions, lines; no `c8 ignore`** |
| `rush rebuild` (repo-wide) | `SUCCESS: 37 operations`, exit 0, no warnings |
| `rush test` (repo-wide) | `SUCCESS: 36 operations`, exit 0 |
| `verify-capability-docs.mjs` | router 19,587/24,000, 24/24 documented, 75 reflexes, 0 failed |
| `generate-capability-feed.mjs --check` | 0 stale |
| `verify-esm-entrypoints.mjs` | 24 checked, 0 failed |
| `verify-bundler-resolution.mjs` | 20 checked, 0 failed |
| `verify-tarball-exports.mjs` | 26 packages, 205 paths, 0 failed |

The repo-wide rebuild matters here for a specific reason: T3 revised shared vocabulary
(`CapacityClaimPurpose`, the update-id bound) and `ts-agent-tasks` has no consumers yet, so the
rebuild is the check that nothing outside the package was implementing it.

**Layer 2 (Copilot) is driven on the PR**; its record is appended below as it happens.

### Copilot round 1 — 3 high, 7 medium, all real, all fixed

Every finding had the same shape: something trusted as "the same one" compared a subset of what
makes it that one. M27–M36 above are the reverts of these fixes; each turns exactly its new test
in `evidence.test.ts` red.

| finding | fix |
|---|---|
| pending completion checked operation id and claims only | the record must be that registration's first record: `checkRegistrationDraft` against the entry's operation id and canonical request, plus the claim ids |
| registration replay accepted any stored operation with the id | only `operations[0]`, the creation evidence, can answer a registration replay. M28 first went **0 red**: the catalog-name check already refused the obvious case, so the test now uses a later operation that carries a creation name — storage does not police later operations' vocabulary |
| read-back compared id and `recordRevision` only | each projection keeps a fingerprint of the exact committed text (UTF-8 length + CRC-32 via `Hash.Crc32Normalizer`); a same-revision out-of-band edit fences. Damage detection, not tamper evidence — documented at `fingerprintOf` |
| `registry.freeze()` result ignored | propagated as `invalid`; ownership released |
| pending entries counted as live parents | parent set is live entries plus registrations completed during the scan |
| unresolved `read()` skipped quarantine | fails `unknown-kind-version` like a resolved record |
| `list()` dropped directories, so `initialize` adopted a root holding one | all child names returned; only files are readable |
| open never applied `checkBounds` | applied per record; a value over its bound blocks as `record-invalid` |
| commit replay omitted the catalog operation name | one `sameOperation` identity (id, type, catalog name, request) now serves commit replay, registration replay and `checkOperations` |
| bounds checked before the kind's encoder normalized the details | re-checked on the normalized draft |

### Copilot round 2 — 5 high, 3 medium, all real, all fixed

Round 1 made storage compare the whole identity it relies on; round 2 found what that identity
was still missing, and two places where a commit purpose licensed more than its contract says.

| finding | fix |
|---|---|
| a resolved record with `operations: []` converted, then crashed replay on `operations[0]` | the record converter requires at least the creation operation |
| `principalKey` not part of operation identity | `sameOperation` includes it, so it is immutable and a retry under another principal is a `conflict` |
| open trusted claims' owner, ownership, purpose, charges and disposition | `checkTaskClaims` checks each claim against what this release writes, for records and for pending entries; a pending entry joins its landed record by full claim equality, not ids. `indeterminate` passes (the ledger fences on it — the designed posture, which an existing test pins) |
| a registration replay rewrote a quarantined record | refused with `unknown-kind-version` before replay |
| any purpose could resolve an unresolved record, and non-observations could move or clear `sourceRevision` | `checkPurpose`: first resolution is an observation; only an observation changes `sourceRevision` |
| same-revision maintenance could change lifecycle, details or `archived` | maintenance must leave semantic content unchanged; only observation timestamps may move |
| after a pending manifest write and a clean record-write failure, the ledger kept the old manifest size | the pending step applies the new manifest entry; a test pins the still-open instance's status to what a reopen computes |
| a profile whose `maxTaskRecordBytes` is below a protected bundle validated, then refused every registration | profile fitting uses the per-record ceiling for `record-bytes` |

Two existing tests were written against states a valid profile or claim set can no longer reach,
and were re-derived rather than deleted: the per-record exact-fit test now measures an unresolved
registration (the largest reservation a profile must hold), and the "reserved growth no longer
fits" test now grows the record out of band instead of shrinking the bound below the bundle.

### Copilot round 3 — 2 high, 1 medium, all real, all fixed

The profile narrowed again: each finding is a place round 2's checks still trusted one field.

| finding | fix |
|---|---|
| registration could overwrite a record-shaped file open had reported as unexpected and promised to leave alone | a new identity re-lists and refuses (`conflict`) if its record name exists; a failed listing refuses `storage-unavailable`, `safe` |
| `checkTaskClaims` validated only the charges present, so a claim missing a dimension undercounted its reservation | a claim must name every dimension its bundle reserves; spending shrinks a charge but never removes it |
| open never required the first operation to be creation evidence, which registration replay answers from | `checkCreationEvidence` (shared with registration) runs at open: a creation catalog operation, `register-external` for an unresolved record |

### Copilot round 4 — 4 high, all real, all fixed

| finding | fix |
|---|---|
| an observation could reparent, retitle or rescope a task, or archive it, with no catalog operation | `checkPurpose`: an observation preserves catalog metadata and `archived` |
| a pending entry held only operation id and request, so a retry after a crash could switch the catalog operation, principal or first-record type | `IPendingInventoryEntry` now carries `operation`, `principalKey` and `recordType`; a resumed registration and open's completion both compare the full `IRegistrationIdentity` |
| a commit replay reported success for a draft carrying extra, never-committed operations | a replay requires every offered operation to be committed identically |
| the manifest was never re-checked after open, so an out-of-band edit could be overwritten | every manifest rewrite first re-lists and re-reads it against the committed fingerprint; a mismatch fences (`storage-corrupt`), an unreadable manifest refuses `safe` |

`IPendingInventoryEntry` is public (T3's own vocabulary), so the API report changes.

### Copilot round 5 — 6 high, 1 medium, 1 low: 5 fixed, 2 declined with reasons, 1 doc

| finding | disposition |
|---|---|
| a tracked record could carry a forged, consumed first-resolution claim | fixed: a first-resolution claim is valid only on a task whose creation is `register-external` |
| registration replay ignored the first-record type | fixed: compared through `firstRecordType`, which survives first resolution (unresolved now, or holding the first-resolution claim) |
| a pending entry with no record was admitted on claim checks alone | fixed: `checkPendingIdentity` — a creation operation, `register-external` for unresolved, request within bound — else blocking |
| a resumed pending registration could overwrite a record file that appeared out of band | fixed: the resume path runs the same unclaimed-name check as a new registration |
| the PR description's counts were stale | fixed in the description |
| a resolved first record created by `register-external` should be refused | **declined**: `registerExternal` takes an optional `initialObservation` (design §7, `IRegisterExternalTask`), whose registration writes a resolved first record. Unresolved ⇒ `register-external` is the invariant; the converse is not |
| commit replay should require the offered post-state to equal the committed record | **declined**: a lost-response retry is prepared against the record it read, which later commits may have advanced. The dedup key is the operation's identity; round 4 already requires every offered operation to be committed. Comparing derived state would refuse legitimate retries |
| observation replay should compare catalog fields and evidence arrays too | **declined** on the same ground: the dedup key is the source revision plus its semantic projection (design §5, *Source API and reconciliation*); catalog fields and owed updates in a retried draft may be stale for the same reason |

