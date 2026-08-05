# State — `agent-memory-ingest-dedup-scope`

Branch: `agent-memory-ingest-dedup-scope` (from `release` @ `b392e1534`)

## Checkpoints

### 2026-08-05 — all five deliverables landed (commit `9bf5ad318`)

**Landed:**

1. **`IMemoryStore.dedupScopeFor(kind): DedupScope`** — added to `IMemoryStore` in
   `store/fileTreeMemoryStore.ts` (see "brief got wrong" below). Synchronous, total, non-`Result`;
   exposes the scope only, never the `IWritePolicy`. OQ-1 resolved as recommended (narrow form).
   Both pre-existing store read sites (`_writeResolved`, `_putVersioned`) refactored to call it, so
   there is exactly one declaration site.
2. **Layer-1 consults the policy** — `_findExactMatch` narrows its cohort to the candidate's own
   entity address for `'entity'` kinds; `'content'` unchanged.
3. **`duplicate-of` edge redirect** — `_collapseRedirects` / `_redirectEdges`; targets only, before
   validation and the cycle guard. OQ-2 resolved as recommended (still emit `duplicate-of` for the
   same-entity no-op), landed together with the redirect as the brief required.
4. **`LIBRARY_CAPABILITIES.md`** — all three fast-follows were stale, not the two the brief named.
5. **`.claude/project/agent-memory-ingest-design.md`** — new note; §1–§4 chosen so every existing
   citation resolves to its original subject, so no citation needed renumbering.

Plus: README `dedupScope` section with the OQ-3 callout, change file, ledger entry, regenerated
`api.md`, and `src/test/unit/ingest/dedupScope.test.ts` (14 tests).

**Gates:** build ✅ · lint ✅ · fixlint ✅ · 721 tests ✅ · coverage 100% on all four metrics ✅ ·
`ts-agent-memory-sqlite-vec` builds untouched (no escalation needed — accessor is on the right seam).

**Fixes verified to actually fix:** each was independently neutralized and the suite re-run.
Neutralizing D2 fails exactly the two entity-granularity tests; neutralizing D3 fails exactly the
two redirect tests. No test passes vacuously.

**In progress:** `code-reviewer` pass on the final diff, then the Copilot loop, then the PR onto
`release` and `result.md`.

**What the brief got wrong** (both recorded in `findings/inbox/`, neither a STOP-rule trigger since
both files exist and the needed content was reachable):

- `types/memoryStore.ts` does not exist. `IMemoryStore` is declared at
  `store/fileTreeMemoryStore.ts:110`, co-located with its implementation. The accessor went there;
  extracting the interface into a new file was judged out-of-scope refactoring.
- `CODING_STANDARDS.md § "Docs ship with the code"` does not exist. The requirement was met anyway
  — the bullet is self-contained.
- The blast-radius claim needs one correction: `DEFAULT_DEDUP_SCOPE` (`'entity'`) is **not** the
  operative default for an unpoliced kind. The store's default policy is a `KnowledgeLwwPolicy`,
  which declares `'content'`, so a kind with no registered policy resolves to `'content'` and is
  **unaffected** by this change. OQ-3's blast radius is specifically kinds registering
  `MemoryCapCullPolicy` / `TemporalVersionedPolicy` / a custom `'entity'`-or-undeclared policy.
