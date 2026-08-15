# vector-rebuild-report-by-kind — every count in a coverage report is resolved by kind

**Shipped**: 2026-08-15. Breaking on a pre-1.0 surface, by agreement with PersonAIlity.

## Summary

`IVectorRebuildReport` answered "how complete is this index?" with bare integers. The consumer
noticed the arithmetic did not add up — a rebuild over a store whose `embedKinds` omits some kinds
left those records in none of `indexed` / `declined` / `skipped`, so a caller computing coverage
undercounted *in the direction of looking healthier*. Four rounds of exchange turned that into a
sharper problem than either side started with: a bare total cannot answer the question a coverage
report exists for, in either direction, and `indexed` — the number a coverage surface actually
renders — is the most dangerous one to leave bare, not the safest.

So every count is now `ReadonlyMap<Kind, number>`:

```ts
interface IVectorRebuildReport {
  readonly indexed: ReadonlyMap<Kind, number>;    // was number
  readonly declined: ReadonlyMap<Kind, number>;   // was number
  readonly excluded?: ReadonlyMap<Kind, number>;  // new
  readonly skipped: ReadonlyArray<ISkippedVectorRecord>;   // unchanged
}
```

Totals stay derivable by summing; the breakdown is derivable from nothing else, because
`IVectorQueryHit` carries no `kind`, `query` answers "what is near this" rather than "what is in
here", and `size` is a scalar. That reasoning is on the type's docstring, closing with the clause
the consumer asked for — *"A new count added to this report is resolved by kind unless there is a
stated reason it cannot be"* — which inverts the default so the burden falls on the exception.
`skipped` states its own reason for staying per-record.

Two consequences shipped with it. `excluded` could not originate in the rebuild, which never sees
an excluded record, so `IMemoryRecordSource.list()` now returns an `IMemoryRecordListing`
(`records` + optional `excluded`) and the store's `asRecordSource()` counts what its filter drops.
And `IVectorIndex.rebuild` returns `DetailedResult<IVectorRebuildReport, IVectorRebuildReport>`, so
a `'fail'` abort carries what it had established — coverage is most wanted exactly when a rebuild
did not finish.

## Files changed

| file | what |
|---|---|
| `ts-agent-memory/src/packlets/vector/vectorIndex.ts` | the contract: report shape, `IMemoryRecordListing`, `rebuild`'s `DetailedResult`, the rule's docstring |
| `ts-agent-memory/src/packlets/vector/inMemoryCosineIndex.ts` | per-kind tallies, partial report on `'fail'` |
| `ts-agent-memory/src/packlets/vector/inMemoryFragmentCosineIndex.ts` | reads the new listing shape; drops `excluded` (no report to put it on) |
| `ts-agent-memory/src/packlets/store/vectorRecordSource.ts` | **new**, package-internal — the filter-and-tally extracted from the store |
| `ts-agent-memory/src/packlets/store/fileTreeMemoryStore.ts` | `asRecordSource()` delegates to it |
| `ts-agent-memory-sqlite-vec/src/packlets/sqlite-vec-index/sqliteVecVectorIndex.ts` | the same, kept observably identical |
| `samples/testbed/.../sqliteVecMemoryPersistence.test.ts` | fake `IVectorIndex` widened |
| `etc/*.api.md` (both libraries) | regenerated |
| `.ai/instructions/LIBRARY_CAPABILITIES.md` | the rebuild and per-kind-participation paragraphs |

## Decisions made during execution

**The `'fail'` failure carries its report on a `DetailedResult` detail, not as a widened success.**
`DetailedResult` is assignable to `Result`, so every reader that only chains `.onSuccess` keeps
compiling; only an *implementation* of `IVectorIndex` has to widen. The alternative — folding an
error field into the report and always succeeding — would have moved failure out of the Result
pattern.

**A `list` failure carries no report at all**, and neither does the SQLite index's `_clear`
failure. Nothing was attempted and the existing index is untouched, so an all-zero report would
describe an index the call never disturbed. Documented as the general "nothing was attempted"
case rather than enumerated, so a future implementation's own pre-loop step is covered.

**`excluded` is optional and the optionality is semantic.** `undefined` means *this source does
not track exclusions*; an empty map means *it does and excluded nothing*. The library never
converts the first into the second. `indexed` and `declined` are knowable by construction and so
are never optional.

**Rejected, with the consumer's own argument the better one:** a store accessor
(`excludedRecordCount()`) would have been additive and non-breaking, but answers *"excluded right
now"* where the report answers *"excluded in this reconcile"* — and those legitimately differ
whenever records are written between reconciles. Two correct-and-unequal numbers are worse than
one absent number. Also rejected: moving the `embedKinds` filter into `rebuild`, which costs
nothing at runtime but pushes a store concern into the `IVectorIndex` contract that every consumer
implementation would inherit.

**Two deviations from the brief**, both recorded in `result.md` and the ledger:

1. **`indexed` is tallied in the loop, not read off the index.** Forced — neither a `Map` nor a
   `vec0` table knows kinds. It makes the sum-of-buckets invariant exact and removed the SQLite
   path's one fallible step, but it gives up a self-correcting property: a source listing the same
   `(scope, id)` twice now makes `indexed` disagree with `size`, where a post-loop size read could
   not. That trade is stated on the field rather than left silent.
2. **`asRecordSource()`'s filter moved to its own module.** `fileTreeMemoryStore.ts` was at 1995
   lines against a 2000-line `max-lines` cap, and in this repo a warning is a CI failure. The
   extraction leaves it at 1991 — **that bought ~9 lines, not a solution.**

## Review

`code-reviewer` ran on the final diff before the first push: one P1, two P2, one P3, all resolved
in a follow-up commit. The P1 was real — the change files said BREAKING in their comment and
`"none"` in their type, which is the type most likely to be dropped from generated changelog
output, i.e. exactly the silence the brief's coordination clause exists to prevent. The prescribed
fix of `"major"` was **not** taken: this is a `lockStepVersion` set with `nextBump: minor`, and the
direct precedent is `agent-memory-rank-reconcile`, whose own comment reads "BREAKING on the active
surface" and which is typed `"minor"`. Full dispositions in `result.md`.

## Followups

- **`fileTreeMemoryStore.ts` line pressure.** Filed as a P2 in `docs/TECH_DEBT.md` **by this
  stream** — there was no standing entry, because the only max-lines entry the ledger carried was
  `apiClient.ts`, retired 2026-08-14 when #620 split it. The file's own history is in
  `CODING_STANDARDS.md` § "A local warning is a CI failure", which is written from this exact file.
  This stream bought ~9 lines against it; the next addition hits the same wall.
- **The fragment index has no rebuild report.** `InMemoryFragmentCosineIndex.rebuild` reads the new
  listing and discards `excluded`, because a bare count has nowhere honest to put it. Explicitly
  out of scope here; when that contract gains a report it gains the rule with it. **Filed in
  `docs/FUTURE.md` by this stream** — it had survived only in a code comment and this README, and
  migration is the event that buries that.
- **`sqlite-vec-path-open`** is queued and still has an unanswered `close`-shape question with the
  consumer.

## Lessons

**The repo-wide `rush rebuild` earned its place, exactly as the brief predicted it would.** Both
libraries were green on their own `build` / `lint` / `test` while a fake `IVectorIndex` in
`samples/testbed` — which neither library's suite can see — was still on the old signature. This is
the "widening a shared interface needs a repo-wide build" rule in `CODING_STANDARDS.md` producing a
concrete catch rather than a hypothetical one. Nothing new to codify; the rule already says this.

**A change file's `type` is part of the coordination mechanism, not bookkeeping.** A `"none"`-typed
entry whose comment says BREAKING is self-contradicting in the one artifact a downstream consumer's
bump tooling actually reads. Worth remembering wherever a brief says "do not let this land
silently".

## References

- Brief: `brief.md`
- Exit artifact: `result.md`
- Metadata: `meta.yaml`
- Coordination flag: `.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-15-rebuild-report-shipped.md`
- Ledger: `docs/WORKSTREAMS.md` § `vector-rebuild-report-by-kind`
