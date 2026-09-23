# State — `agent-tasks-t3`

Resume by reading `brief.md`, then this file newest-entry-last.

---

## 2026-09-22 — kickoff: inputs verified, design fixed, predictions written

**Missing-input check.** Every required-reading file exists; the tree matches the brief (T1
`1337c27c`, T2 `0249e85d`, branch `claude/agent-tasks-t3` based on the integration branch). Both
local roots qualify: `/tmp` is ext4 (`0xef53`), `/dev/shm` is tmpfs (`0x1021994`), Node 22.22.2.

### Design decisions (made from the design, not asked)

1. **One repository class, `FileTreeTaskRepository`, over an injected
   `IAtomicFileTreeDirectoryItem`.** The two "adapters" are the FileTree accessors themselves
   (in-memory and `FsFileTreeAccessors`); nothing in the storage packlet branches on which one is
   behind the root. No `node:fs` import in `src/packlets`.
2. **Mode is `'session' | { durable: 'process-crash' }`** and maps 1:1 onto the requested
   `AtomicWriteGuarantee`. Durable on a root whose capabilities lack `'process-crash'` fails
   `unsupported` at construction — never degrades. Anything stronger fails before any I/O.
3. **Read path.** Durable mode reads through the strict-text capability (malformed UTF-8 is
   corruption); session mode reads raw text, because the in-memory store holds strings and cannot
   answer the question (design §8.1: "in-memory string fixtures … do not claim byte-corruption
   detection"). Everything after the text — JSON parse, strict converters, invariants — is one
   path for both modes, and **the write path runs the same converter over the exact record it is
   about to write** (trap #4, symmetry).
4. **Serialization** is RFC 8785 canonical JSON (`Normalizer.canonicalize`), so the on-disk bytes
   are the canonical bytes §8.6 accounts in.
5. **Archive tombstone lives in the task record only** (`archived: true`); the inventory names
   the task and does not change on archive. Deviation from §8.3's sentence "inventory … contains
   archive tombstones", made because putting it in both is a dual write with no atomicity between
   the files and would be a per-mutation inventory rewrite the brief forbids introducing silently.
   Recorded here and in `result.md`.
6. **Unknown data.** Unknown kind/detail version on a structurally valid record → quarantined,
   non-blocking, never rewritten, commits refused `unknown-kind-version`. Unknown *format* version
   (record or manifest), unknown envelope schema version, malformed JSON, invalid UTF-8 →
   blocking: the ledger cannot account for what it cannot read, so the repository opens only as a
   recovery handle, and nothing is rewritten. "Survives a round trip" = the bytes are identical
   after open + close.
7. **Consumer and source records** are named in the inventory format now (the last cheap moment),
   and T3 validates only what it owns: presence, strict UTF-8/JSON, `formatVersion: 1`, and
   filename/ID agreement. Their content converters are T6/T7's.
8. **Writer.** `withWriter` rejects when a writer is already active (covers nesting and
   concurrency without an unbounded queue or a Node-only async-context API); a handle used after
   its callback returns fails. Serialization, not a transaction: a committed replacement stays
   committed if the callback later fails.
9. **Commit purposes** are explicit: `operation` (dedup evidence is the stored operation),
   `observation` (dedup evidence is the source revision), `maintenance` (no task revision change,
   no new operation, may prune). Replay of a stored operation is checked **before** the revision
   precondition, because a lost-response retry carries a stale expected revision.
10. **Capacity.** Registration mints a `terminal-closeout` claim (plus a new `first-resolution`
    claim for an unresolved registration — T1 revision), owned by the pending inventory entry
    and transferred to the record by the same claim IDs. Protected steps (unresolved→resolved,
    open→terminal, →archived) spend from their own claim; a claim's charges **shrink** by what a
    step spends, so `used + reserved ≤ limit` holds throughout and no step spends another
    record's reservation. Archive consumes the closeout claim. Per-record `record-bytes` is
    checked per record (bytes + that record's reserved growth).
11. **Idempotent replay re-establishes the flush boundary** by atomically rewriting the identical
    record (design §8.2 last paragraph), rather than returning a success whose directory entry
    was never flushed.
12. **Fencing.** An atomic-write failure with `visibility: 'replaced' | 'unknown'` fences the
    repository (`health: unavailable`), returns `commit-indeterminate` carrying the operation ID,
    and every later read/write fails until reopen. `'unchanged'` returns `storage-unavailable`,
    `retry: safe`, and changes nothing in memory.

### Crash-window predictions — written before the first run

Harness: a child process opens a real Node FileTree root, performs one scripted operation, and
`SIGKILL`s itself at a chosen leaf boundary of the Nth atomic write (by patching the ops object
`FsFileTreeAccessors` calls through — same technique as F2). The parent reopens through the real
Node path and asserts.

| # | operation | kill point | predicted on-disk truth after reopen | a miss means |
|---|---|---|---|---|
| C1 | register | write 1 (pending inventory), before rename | task absent from inventory; no reservation; retry registers once | pending intent was visible before its rename |
| C2 | register | write 1, after rename | pending registration, record missing, **claims reserved**; retry completes with the same claim IDs, reserved unchanged, used +1 task | reservations do not survive the crash, or retry double-charges |
| C3 | register | write 2 (task record), before rename | same as C2 (temp never promoted) | a temp was read as a record |
| C4 | register | write 2, after rename | open completes the registration (record present); task readable; claims counted once | pending+record double counts, or open refuses a valid pending |
| C5 | register | write 3 (live inventory), before rename | same as C4 | — |
| C6 | register | write 3, after directory flush, before return | live; retry returns the existing record without a second charge | replay allocates |
| C7 | commit (operation) | before rename | old record whole; operation absent; retry applies once | torn/partial replacement |
| C8 | commit (operation) | after rename, before directory flush | new record whole; operation present; retry is a replay (no new record revision beyond the boundary rewrite) | a replay re-applies |
| C9 | commit (terminal) | after rename | terminal state + owed updates + operation durable together; closeout claim spent in the same record | state and obligations split |
| C10 | resolve unresolved | before / after rename | unresolved whole, or resolved whole with identity and updates; never an in-between | resolution not atomic |
| C11 | raise limits | before / after rename | old profile or new profile, whole | torn policy |
| C12 | any | orphan temp left behind | reopen removes it and the record is untouched | cleanup deletes data or skips orphans |

Out of T3's matrix (belong to later slices, listed in §8.4): source save/cursor windows (T6),
dispatch marker (T6), context issuance and acknowledgement (T7).

### Mutations planned (watch each fail)

M1 skip the pending-inventory write · M2 write the record before the pending entry · M3 mark live
before writing the record · M4 treat `visibility: 'unknown'` as unchanged (no fence) · M5 drop
the replay-before-precondition order · M6 omit the operation-superset check · M7 skip the
flush-boundary rewrite on replay · M8 double-charge on pending→live · M9 skip strict UTF-8 in
durable mode · M10 let open initialize over a missing manifest · M11 allow durable on a
session-only root · M12 ledger ignores pending-entry claims · M13 allow in-place lowering.

---

## 2026-09-22 — implementation + scenario suites done; layer-1 review running

**Built:** `storage` packlet (`FileTreeTaskRepository`, open/initialize scan, ledger, claims,
commit rules, record store over the injected root), `types/storage.ts`, `storageConverters`.
T1 revisions: `CapacityClaimPurpose` += `first-resolution`; claim charges shrink as spent;
`taskUpdateId` + update-id bound +19; `maximumResolutionCharges`; profile must hold an
unresolved registration's two bundles together; `TaskCapacityState` semantics settled.

**Added beyond the first design pass (found while writing tests):**
- per-task operation limit with the closeout's two slots held back (was missing entirely);
- observation replay: same source revision + same projection = replay, different = `source-gap`;
- admission is checked against the protocol's *widest* state (record written while the pending
  entry still carries request + claims) — the settled footprint under-counts by ~1 KiB, and the
  capacity test now measures the peak rather than assuming it;
- a parent whose record failed validation no longer cascades a spurious "dangling" issue;
- test environments share one global ID sequence — per-environment counters minted colliding
  claim IDs across reopen, which open (correctly) reports as an integrity failure.

**Crash matrix, first run against the predictions:** all C1–C11 predictions held on ext4; the only
two reds were a harness defect (the "retry" rebuilt its request from the post-commit record, so it
was not a retry). Fixed by building every scenario request from the pre-commit state. Extended
to tmpfs: 75 tests, 37 per filesystem + the qualification guard.

**Next:** layer-1 `code-reviewer` (running) → mutation pass (`scratchpad/mutate.py`, 24
mutations; UNVERIFIED if a pattern is absent or it does not build) → coverage closure → gates.

## 2026-09-23 — Copilot round 1 addressed

Ten findings (3 high, 7 medium), all verified real and fixed; regression tests in
`storage/evidence.test.ts`, reverts M27–M36 each verified red. 742 tests, 100% coverage. Next:
push, reply/resolve threads, re-request Copilot; CodeRabbit once the Copilot loop settles.

## 2026-09-23 — Copilot round 2 addressed

Eight findings (5 high, 3 medium), all real and fixed; M37–M47 each verified red. 760 tests,
100% coverage, zero warnings. Next: push, reply/resolve, re-request Copilot (round 3).

## 2026-09-23 — Copilot round 3 addressed

Three findings (2 high, 1 medium), all real and fixed; M48–M50 verified red. 763 tests, 100%.
Finding count is falling (10 → 8 → 3) and narrowing to one-field gaps in round-2 checks; one
more round to confirm the trend before calling diminishing returns.

## 2026-09-23 — Copilot round 4 addressed

Four findings (all high), all real; M51–M54 verified red. 768 tests, 100%. Findings went
10 → 8 → 3 → 4 and are still substantive (each a real integrity gap), so the loop continues.
A full mutation re-run (M1–M27 confirmed red before it was stopped) resumes after this push.
