# Brief: `agent-memory-atomic-writes` — FileTreeMemoryStore writes records atomically

Orchestrator-owned; frozen at kickoff. Put questions in `state.md`.

**Origin:** personaility#700 (fgv-ask). Long form:
`.ai/notes/fgv-share/ASK-2026-10-23-memory-store-atomic-writes.md` on personaility `working`.
User decisions 2026-10-26: #700 first, then #701 as a separate stream on top of this one; on a
non-qualified root, degrade and report by default, with an opt-in that refuses.
**Base / PR target:** `integration/asks`.

## Facts already verified (orchestrator assessment against `integration/asks` @ f4b57551)

- The store writes files in exactly two places, both in
  `libraries/ts-agent-memory/src/packlets/store/storeFileAccess.ts`:
  - `writeRecordFile` (~:185), via `createChildFile` / `setRawContents`;
  - `deleteRecordFile` (~:216).
- Every rewrite goes through `writeRecordFile`:
  - flat put (`_persist`);
  - the new version file of a versioned put;
  - `_invalidateVersion`;
  - the reconcile restamp `_rewriteEnvelope`.
- Deletes and `ensureScopeDir` (mkdir) cannot tear, so they don't change.
- There are **no on-disk index files**. The ask is wrong on this point; record it in `result.md`.
- The default `onRecordError: 'fail'` means one torn record fails the whole open.
- `writeChildAtomically`, `getAtomicWriteCapabilities` and `cleanupAtomicTemporaries` are in
  `@fgv/ts-json-base` (`fileTreeAccessors.ts`, `directoryItem.ts`, `fsTree.ts`, `inMemoryTree.ts`,
  `fs-atomic/atomicRootQualification.ts`). Qualification:
  - Linux ext2/3/4 or tmpfs only;
  - `'process-crash'` is the strongest guarantee;
  - the in-memory tree offers `'session'`.
- Precedent: `ts-agent-tasks` `storage/recordStore.ts:60-79`, `openRepository.ts:136-145`,
  `repository.ts` `durability`/`mode`, and `storage/rootOwnership.ts`.
- **`fileTreeMemoryStore.ts` is ~1975 lines against a 2000-line `max-lines` cap.** A lint warning
  fails CI. Put new logic in `storeFileAccess.ts` or new modules, never in that file.

## Decisions

1. **Atomic writes.** `writeRecordFile` writes through `writeChildAtomically` with the store's
   chosen guarantee whenever the root supports one. That includes the in-memory root at
   `'session'`.
2. **Durability report.** Add a synchronous store property, computed once at `create`:
   ```ts
   store.durability: {
     atomic: boolean;
     guarantee?: AtomicWriteGuarantee;
     reason: string;
   }
   ```
   It takes the strongest guarantee `getAtomicWriteCapabilities()` lists. It does **not** go in
   `coverage()`.
   - If the qualification reason isn't reachable from the public capability API, a small additive
     optional `reason` on `IAtomicWriteCapabilities` in ts-json-base is in scope.
   - Also fix the stale comment at `ts-json-base/.../directoryItem.ts:179` ("the filesystem one is
     not yet atomic-capable").
3. **Non-qualified roots.**
   - Default: degrade and report. Plain writes, `durability.atomic: false`, and a reason.
   - Opt-in `create({ durability: { require: 'process-crash' | 'session' } })` refuses a root that
     can't give that guarantee.
   - A write that later can't honour the chosen guarantee (e.g. a subdirectory on another mount)
     **fails loudly**. It never falls back to a plain write.
4. **Uncertain-visibility outcomes.** An atomic write can fail with visibility `'replaced'` or
   `'unknown'`.
   - On `'replaced'`, treat it as committed: patch the resident index and report success.
   - On `'unknown'`, re-read the file to settle it.
   - Never report "failed" while the new record is on disk without saying so, and never leave the
     resident index disagreeing with disk.
5. **Single-writer guard.** Add an in-process root-ownership guard, as in ts-agent-tasks'
   `rootOwnership.ts`. A second `FileTreeMemoryStore` on the same root in the same process is
   refused. Release it on dispose (add `dispose()` if the store has none).
   - This guard is the precondition the #701 compare-and-set relies on, so make it unambiguous.
6. **Temporary sweep.** At open, while holding the guard, sweep atomic-write temporaries in each
   scope directory the walk visits (`cleanupAtomicTemporaries`). Report what was removed (e.g. on
   the open/durability report or a logger at info).
7. **Not atomic, by design.** Multi-file operations (a versioned put of N+1 files, a cull of 1
   write + N deletes) stay non-atomic. Document the crash tolerance that already holds: the highest
   `seq` wins, and the cap self-corrects.

## Acceptance

- [ ] A test proves an interrupted write leaves the previous record intact. Drive it through the
  ts-json-base atomic seam: inject a failure between the temp write and the rename, or reuse the
  qualification suite's crash helpers if they are exported. Don't mock the store.
- [ ] Tests:
  - the durability report on an in-memory root and on a qualified fs root;
  - `require` refusal;
  - `'replaced'` and `'unknown'` handling;
  - the ownership guard;
  - the temp sweep.
  - Each new test is shown red against the base before the fix.
- [ ] `CAPABILITIES.md` and the README describe durability, the guard, the non-atomic multi-file
  cases and the options. Add a `ts-json-base` CAPABILITIES note if its surface changed.
- [ ] Change files: `ts-agent-memory` `minor`. The guard refusing a second instance is
  `BREAKING:`. `ts-json-base` `minor`, or `none` if only the comment changed.
- [ ] Gates:
  - package build, lint, test at 100% coverage;
  - repo-wide `rush rebuild` and `rush test`;
  - `change --verify --target-branch origin/integration/asks`;
  - prettier 2.8;
  - `max-lines` stays under the cap.
- [ ] `result.md` enumerates every check-then-act window touched (write → visibility settle →
  index patch; guard acquire → sweep → walk) and what re-checks after each.
- [ ] Close-out per `finalize-task` to `.ai/tasks/completed/2026-10/agent-memory-atomic-writes/`;
  ledger entry (`#TBD`); feed.

## Mechanics

Own worktree. Push only to `agent-memory-atomic-writes`; no PR. Commit before gates; run gates in
the foreground with per-worktree log paths. No sub-agents.
