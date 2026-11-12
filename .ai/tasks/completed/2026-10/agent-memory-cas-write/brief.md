# Brief: `agent-memory-cas-write` — a conditional (compare-and-set) record write

Orchestrator-owned; frozen at kickoff. Put questions in `state.md`.

**Origin:** personaility#701 (fgv-ask). Long form:
`.ai/notes/fgv-share/ASK-2026-10-23-memory-store-compare-and-set.md` on personaility `working`.

**User decisions, 2026-10-26:**
- The guarantee is **in-process only**: for writers that share one `FileTreeMemoryStore` instance per root. The `agent-memory-atomic-writes` guard (#700, already on the base) enforces one instance per root.
- Persist a `seq` high-water mark to close the cross-restart ABA hole.

**Base / PR target:** `integration/asks`, which contains `agent-memory-atomic-writes` (#756, 7f81295b1).

## Facts (verified at f4b57551, before #700 — re-verify against the current base: #700 moved record writes to `writeChildAtomically`, added `dispose()` and the ownership guard)

- `seq` is store-global and strictly increasing, assigned in `_buildRecord` and `_putVersioned`.
- `seq` is resumed at open from the highest `seq` on disk. If the highest record was deleted before a restart, the counter can re-issue a `seq`. That is the ABA hole.
- `contentHash` covers only `{kind, body, links}`. It excludes tags and provenance and is not monotonic, so it is **not** the token.
- Reconcile restamps (`_rewriteEnvelope`) and `_invalidateVersion` rewrite a record without changing `seq`.
- The read side already exposes `envelope.seq`.
- The write lock is `_enqueue`.
- For flat kinds, content dedup in `_writeResolved` can return a *different id's* record. The check must therefore come **before** dedup.
- `fileTreeMemoryStore.ts` is close to its 2000-line cap. Put new logic in modules.

## Decisions

1. **API.**
   - `put(record, options?: { expected?: number | 'absent' })`. `expected` is the `seq` of the current record or current version, or `'absent'` if the caller expects none.
   - `put` returns `Promise<DetailedResult<IMemoryRecord<unknown>, IMemoryWriteFailure>>`, where
     `IMemoryWriteFailure = { code: 'conflict'; current: number | 'absent' } | { code: 'rejected' | 'invalid' | 'io'; … }`.
     Follow ts-agent-tasks `types/failure.ts` as precedent.
   - Add the same `expected` option to `delete`.
   - On a mismatch, write nothing and still emit the write-failure observation.
2. **Placement.** The check runs inside the write lock, after the address is resolved and **before dedup**:
   - flat kinds: before the content-dedup branch;
   - versioned kinds: before entity dedup, comparing against the current version's `seq`.
   Name every `await` between the check and `_persist`, and say why each one is safe. Inside the lock, only same-instance writers can interleave, and they are serialized.
3. **High-water mark.**
   - Persist the store's `seq` high-water mark in one small store-owned file at the root, written atomically with the #700 path.
   - Read it at open, and resume at max(high-water, highest on disk).
   - Advance it before (or atomically with) the record write that uses the new `seq`, so a crash can never re-issue a `seq`.
   - Document the file and its fault model. A missing file means "derive from disk", which is the current behaviour, so old vaults still open.
4. **Ingest.** If `ts-agent-memory`'s ingest orchestrator merges into an existing target, pass `expected` from its snapshot and report a conflict per candidate. Do not retry automatically. If this turns out larger than a small change, record it in `state.md` and leave it as a follow-up rather than widening the stream.
5. **Interface.** Widening the return type of `IMemoryStore.put` / `delete` breaks implementers only. Use a change file `minor` with prefix `BREAKING (implementers only):`.
   - Fix the two known test doubles: `ingest/orchestrator.test.ts` `mockStore` and `tools/memoryTools.test.ts`.
   - Grep `libraries/ tools/ samples/` for any others.
   - Update callers that relied on `Result` methods only.

## Required evidence

This is an ordering surface. In `result.md`, enumerate every check-then-act window, and give a revert matrix showing which test goes red when each ordering guarantee is broken. At minimum:
- check-before-dedup on both layouts;
- the check under the lock against a concurrent same-instance put;
- delete with `expected`;
- high-water persisted before a `seq` is used: a test simulating delete-highest, reopen, then a stale `expected` must conflict.

## Acceptance

- [ ] Tests use Result matchers. New behaviour is shown red first.
- [ ] Gates:
  - package build, lint and test at 100%;
  - repo-wide `rush rebuild` **and** `rush test` (the interface widened);
  - `change --verify --target-branch origin/integration/asks`;
  - prettier 2.8 (do not run prettier `--write` on markdown);
  - `max-lines`.
- [ ] Docs: README, `CAPABILITIES.md`, and the TSDoc stating the in-process-only guarantee precisely.
- [ ] Close-out per `finalize-task` to `.ai/tasks/completed/2026-10/agent-memory-cas-write/`, with a ledger entry (`#TBD`) and the feed.

## Mechanics

Use your own worktree. Push only to `agent-memory-cas-write`, and open no PR. Commit before running gates. Run gates in the foreground, with log paths specific to your worktree. No sub-agents.
