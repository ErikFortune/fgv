# Finding — collapsed candidates are never offered to the relation extractor (deliberate non-goal)

**Stream:** `agent-memory-ingest-dedup-scope`
**Severity:** low — a latent expressiveness gap, not a defect; no known consumer impact
**Status:** deliberately NOT fixed in this stream; surfaced for a future scoping decision

## Observation

`MemoryIngestOrchestrator._relate` builds the host's stage-5 input from `writablePlans` only:

```ts
const relationCandidates: IRelationCandidate[] = writablePlans.map((plan) => ({
  candidate: plan.candidate,
  id: plan.refTarget
}));
```

`writablePlans` excludes every `duplicate-of` plan. So when candidate B collapses onto an existing
record R, the `IRelationExtractor` is never told B existed, and cannot propose any edge touching it
— not even the semantically correct `A --> R`.

## Why this stream did not change it

The deliverable-3 redirect fixes the reported failure completely: an edge that *does* name a
collapsed candidate's address (a host can compute one from `IIngestItem` content, which is how the
reporter hit it) is now rewritten onto the collapse target instead of failing the whole item. That
closes the hazard.

Making collapsed candidates *visible* to the extractor is a different, larger change:

- It would mean handing the extractor a candidate whose `id` is an existing record's address, so
  edge **sources** could then legitimately name a record that is not being written. Today
  `_validateEdges` rejects exactly that, and `_loadCandidate` filters edges by source against the
  plans it writes — an edge sourced at a non-written record would be silently dropped rather than
  persisted, which is worse than the current loud rejection.
- Fixing that properly means deciding whether a `duplicate-of` collapse should be able to *mutate
  the target record's links*, which is a write-semantics question (the target is an existing record
  with its own policy and merge surface), not an edge-plumbing one.

That is design work with a real blast radius, and nothing in the brief asks for it.

## Suggested disposition

Leave as-is unless a consumer reports it. If it is picked up, the question to answer first is:
**should a `duplicate-of` collapse be able to add links to the record it collapsed onto?** If yes,
it needs a write path through the target's `IWritePolicy`, not a stage-5 edge. If no, the current
shape is correct and this finding closes as working-as-intended.

Documented in `.claude/project/agent-memory-ingest-design.md` §3 as a deliberate limit.
