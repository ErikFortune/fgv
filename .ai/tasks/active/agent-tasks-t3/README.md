# agent-tasks-t3 — FileTree records, durable commit and reopen

**Shipped**: 2026-09-23 via [PR #686](https://github.com/ErikFortune/fgv/pull/686) into `integration/agent-tasks-v1` (finalized at the agent-tasks cluster close, 2026-10-01).

## Summary

T3 gave `@fgv/ts-agent-tasks` a durable task path: `FileTreeTaskRepository`, one implementation over
an injected `FileTree` root, whose in-memory and Node "adapters" are simply the two FileTree
accessors that implement the F1/F2 atomic capability. The storage packlet never imports `node:fs`.
Durable mode is `{ durable: 'process-crash' }` and nothing stronger; a root without that capability
fails `unsupported` before any I/O. Each accepted mutation replaces one task record atomically —
state, owed updates, operation evidence and capacity claims together. Registration is ordered
(pending inventory entry → record → live entry), and open validates every record, completes landed
registrations, and otherwise returns a write-nothing recovery handle. A3 capacity is persisted in
its owning records and rebuilt into a ledger at every open. Evidence: a real-Node SIGKILL crash
matrix (C1–C12) on ext4 and tmpfs where every pre-written prediction held, and a 92-row checked-in
mutation matrix. 794 tests, 100% on all four metrics, no `c8 ignore`.

## Files changed

- `src/packlets/storage/` (new) — `repository.ts`, `openRepository.ts`, `commitRules.ts`,
  `ledger.ts`, `claims.ts`, `projection.ts`, `recordStore.ts`, `rootOwnership.ts`, `layout.ts`,
  `model.ts`, `failures.ts`.
- `src/packlets/types/storage.ts` (new); `capacity.ts`, `capacityProfile.ts`, `updates.ts` revised.
- `src/packlets/converters/storageConverters.ts` (new); `capacityConverters.ts`,
  `identityConverters.ts`, `taskConverters.ts` revised.
- `perf/mutationMatrix.js` (new, on-demand; `--check`, `--pkg`).
- Tests under `src/test/unit/storage/` (`crash`, `evidence`, `commit`, `corruption`, `capacity`,
  `edges`, `registration`, `initializeOpen`, `durable`, `faults`) and helpers
  (`crashScenarios`, `faultyRoot`, `storageFixtures`).
- `CAPABILITIES.md`, `README.md`, API report, change file, `docs/WORKSTREAMS.md`, plan status lines.

## Decisions made during execution

From `result.md` § *Decisions that deviate from, or sharpen, the design text* and § *T1 vocabulary*:

- **Archive tombstones in the task record only** — §8.3 also lists them in the inventory; doing both
  is an unatomic dual write and a per-mutation inventory rewrite the brief forbade introducing
  silently.
- **Unknown kind is quarantined (advisory, never rewritten); unknown format or envelope schema
  version blocks.** Round-trip survival is tested as byte identity after open + close.
- **Consumer and source records named in the inventory format now**, validated by header only.
- **Admission against the protocol's widest state**, measured rather than assumed.
- **Replay re-establishes the flush boundary** by rewriting the committed record and manifest.
- **Open's only write** is completing registrations whose record landed; it makes no clock read, ID
  mint, log call or source I/O (tested with spies).
- **T1 revisions:** `first-resolution` claim purpose (5 → 6); reserved charges shrink as spent;
  `taskUpdateId` = `<taskId>:<revision>:<ordinal>`, which makes reordering `allUpdateCategories` a
  storage-format change.
- **Copilot round 5: replay dedups on operation identity, not derived post-state** — two (by the
  table, three) findings declined with design citations.
- **Residual, documented:** two *session* repositories over one real directory via two items are not
  detected; FileTree does not expose what backs a root.

## Followups

> **Routed at the cluster close (2026-10-01).** Every item below described as recorded nowhere durable
> (or not in `TECH_DEBT.md`) is now in `docs/TECH_DEBT.md` under *[P3] `ts-agent-tasks` — deferrals the
> agent-tasks slices recorded only in their own `result.md`*.

| item (from `result.md` § *What a later slice must decide*) | where it went |
|---|---|
| T4: resident summaries/indexes; no child-by-name lookup on `IFileTreeDirectoryItem` | Indexes → `agent-tasks-t4`. The FileTree lookup gap: **recorded nowhere durable** (not in `docs/TECH_DEBT.md`) |
| T5: reused operation id → `idempotency-conflict` or `conflict` | Decided by T5 (rejected receipt for a command key; `conflict` for a catalog key) — T1 table, `CommandRejectionReason` row |
| T6: source record content; observation replay semantics | `agent-tasks-t6` |
| T7: consumer record content; claim audiences empty | `agent-tasks-t7` (audiences computed and verified by storage) |
| T8: archive consumes acknowledgement reservation — safe only once archive is gated | `agent-tasks-t5` already refuses archive while an update is owed (`retention-blocked`, T1 table); retention is `agent-tasks-t8` |
| Format: stop intent as a v1 field | T9 added `stops?: IStopIntent[]` to `IResolvedTaskCommitRecord` (`agent-tasks-t9/result.md`); its format-version treatment was not checked here |
| M90/M91 at 0 red pending T6/T7 | Re-examined in `agent-tasks-t8/result.md` (M91 still 0 red "by T3 disposition") |
| Session/session same-directory detection (upstream FileTree capability) | **Recorded nowhere durable** beyond `result.md` and the ledger narrative |

## Lessons codified during the run

- **A mutation that does not build, or whose pattern is absent, is UNVERIFIED — never "nothing went
  red"** (F2's lesson, applied: M4, M17, M71, M72 did not build on first attempt).
- **A mutation row is only as current as the line it points at** — `--check` found eight rows stale
  after refactors; the full matrix was re-run against the final source, surfacing five test gaps.
- **A test titled for a scenario must reach it** — the round-5 "after first resolution" test never
  resolved the task (M73/M81/M83/M84 went 0 red until fixed).
- **Build crash-retry scenarios from the pre-commit state** — the first run's only reds were a
  harness that "retried" from the post-commit record.
- **Copilot finding profile as stop signal:** rounds 1–4 found protocol integrity gaps; rounds 5–8
  found read-path re-checks of write-path invariants, host-misuse lifetimes and regressions of the
  prior round's fix. Stopped at 8 of a 10 cap.

## References

- Brief: `brief.md`
- Live state: `state.md` (crash-window predictions written before the first run)
- Exit artifact: `result.md`
- Harness: `libraries/ts-agent-tasks/perf/mutationMatrix.js`
- PR: [#686](https://github.com/ErikFortune/fgv/pull/686)
