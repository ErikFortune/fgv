# Stream brief — `agent-memory-index-injection-seam`

## Context

The consumer (PersonAIlity) asked for "the `IVectorIndex` treatment" for the record index.
Orchestrator triage found **most of it already exists**:

- `IMemoryIndex` is a real interface (`libraries/ts-agent-memory/src/packlets/index/memoryIndex.ts`).
- `MemoryIndex implements IMemoryIndex`.
- `temporalRetrievers.ts` (and every other retriever) already consumes `IMemoryIndex` as an
  injected dependency.
- `patch(op, entry)` already provides incremental maintenance.
- `IMemoryEnvelope.contentHash` is already the staleness primitive.

The consumer has re-verified and accepted all of the above.

**The one genuine gap:** `FileTreeMemoryStore` already types its index field as `IMemoryIndex`
internally (`IInternalParams.index`, `this._index = params.index`), but the public `create()`
hardcodes `MemoryIndex.create()` into those internal params. There is no way for a caller to
supply their own.

## Scope (deliberately narrow)

Expose the index as an **optional injection point on the public `create()` params**, defaulting
to the current concrete implementation. That is the whole deliverable.

### Why the consumer wants it (this shapes the docs)

**NOT** as an experimentation seam for alternative index backends. `IMemoryIndex`'s read surface
returns full records by construction (`entries()` → `IIndexedMemoryRecord`;
`byKind` / `byTag` / `byRecency` / `byRank` → `IMemoryRecord<unknown>` = `{envelope, body}`), so
**any** index injected behind the current contract still materialises every body. Injecting a
"persisted" index today moves the storage and keeps the resident-memory ceiling.

It is wanted as an **instrumentation seam**: the consumer will wrap the shipped `MemoryIndex` in
a counting/timing decorator to measure resident bytes by kind, open cost against vault size, and
where the curve actually bends — so a later (breaking) partial-read redesign is driven by numbers
rather than estimates. Their words: *"We've been asserting 'won't scale past thousands' without
measuring it once."*

**This distinction is load-bearing and must appear in the TSDoc.** A reader must not conclude
that injecting a custom index fixes resident memory.

## Requirements

1. Optional index param on the public `FileTreeMemoryStore.create()` params, named consistently
   with sibling optional params (`vectorIndex` / `fragmentIndex` / `observers`).
2. Omitted → behaviour **byte-identical** to today (`MemoryIndex.create()`).
3. Supplied → the store uses it for **every** index operation it currently performs, including
   `rebuild` during `_initialIndex` and `patch` on every write.
4. TSDoc per the "why" above, including the explicit non-guarantee.
5. Tests: (a) default path unchanged; (b) an injected index receives the store's `rebuild` /
   `patch` calls (decorator/spy over the real `MemoryIndex` — mirrors the consumer's intended
   use); (c) an injected index's query results are the ones the store returns.

## Out of scope

- Any change to `IMemoryIndex`'s method signatures or return types (the partial-read redesign is
  separate, design-first work).
- Backlink type-discrimination (sibling stream).
- `libraries/ts-agent-memory/src/packlets/vector/**` (concurrent stream owns it).
- `libraries/ts-extras/**`, `samples/**`.
- `docs/WORKSTREAMS.md`, `docs/STATUS.md` (orchestrator-owned).

## Gates

- `rushx build` / `rushx lint` / `rushx test` at 100% coverage in `libraries/ts-agent-memory`
- `rushx fixlint` before the final commit
- No `any`; fallible ops return `Result<T>`
- Scenario tests BEFORE coverage-chasing; `code-reviewer` on the diff BEFORE the coverage-closure
  pass
- Rush change file; `etc/ts-agent-memory.api.md` regenerated
- Commit, push, PR against `release`. Do NOT merge.
