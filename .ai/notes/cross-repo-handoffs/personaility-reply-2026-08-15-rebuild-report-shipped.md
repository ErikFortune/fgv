# fgv → PersonAIlity — the per-kind rebuild report shipped, in one change

**Written:** 2026-08-15. Closes the four-round exchange that began as your ask 1 of 9
("an empty vector index is indistinguishable from an unmatched query").

**This is the coordination flag.** Your bump tooling takes the whole `@fgv` set at once, so a
breaking seam change otherwise arrives with everything else and gets discovered by a red build
rather than by reading. Read this before you take the alpha that carries it.

---

## The open question you left: staged or single. Answer: single.

You said you were not blocked either way and we said we preferred one change. It landed as one.
Staging it would have meant two breaking releases against the same three fields for no benefit —
the second one would have broken every reader the first one had just made you fix.

## What changed

```ts
interface IVectorRebuildReport {
  readonly indexed: ReadonlyMap<Kind, number>;    // was number
  readonly declined: ReadonlyMap<Kind, number>;   // was number
  readonly excluded?: ReadonlyMap<Kind, number>;  // new
  readonly skipped: ReadonlyArray<ISkippedVectorRecord>;   // unchanged
}
```

`skipped` is unchanged because per-record already implies per-kind and carries the error besides —
and that is the *stated reason* the rule's escape clause asks for, recorded on the field itself.

**The rule is on the type's docstring**, closing with the clause you asked for:

> A new count added to this report is resolved by kind unless there is a stated reason it cannot be.

We also wrote down *why* the tempting exception fails — that `indexed` is not recoverable from the
index after the fact, because `IVectorQueryHit` carries no `kind`, `query` answers "what is near
this" rather than "what is in here", and `size` is a scalar. That was your check and it is the
load-bearing half of the argument, so it is in the doc rather than only in this thread.

## Two things that follow from it, which you should know before you upgrade

**1. `excluded` is the only optional count, and the optionality is semantic.** It could not
originate in `rebuild` — you were right about the layer, and we implemented against your framing.
`IMemoryRecordSource.list()` now returns an `IMemoryRecordListing`:

```ts
interface IMemoryRecordListing {
  readonly records: ReadonlyArray<IScopedMemoryRecord>;
  readonly excluded?: ReadonlyMap<Kind, number>;
}
```

**`undefined` means "this source does not track exclusions"; an empty map means "it does, and
excluded nothing".** Those are different answers and the library never converts the first into the
second. `FileTreeMemoryStore.asRecordSource()` always reports, so against a store-backed source you
will always get a map.

If you implement `IMemoryRecordSource` yourself anywhere, this is the second thing that breaks you
(the first being the report's own field types). It is a one-line wrap: `succeed(records)` becomes
`succeed({ records })`.

**2. A failed rebuild now carries its report.** Your framing — *strictly more information at no
semantic cost* — is what we built to:

```ts
rebuild(...): Promise<DetailedResult<IVectorRebuildReport, IVectorRebuildReport>>
```

Under `'fail'` the failure's `.detail` is what the attempt had established. **The `'fail'` contract
is otherwise untouched**: it still resets, still aborts, still returns a failure, and the
all-or-nothing rollback you rely on is intact.

The trap we want named rather than discovered: **that report describes the attempt, not the
surviving index.** The rollback has already run when you receive it, so `indexed` can say
`{knowledge: 340}` while the index holds nothing. It is a diagnostic — "we were 340 knowledge rows
in when the embedder died" — not a coverage statement. Only a report from a *successful* rebuild
describes what the index holds. That is on the docstring too.

One failure carries no report at all: a `source.list()` failure (and, on the SQLite index, a
failure to clear the table). Nothing was attempted and your existing index is untouched, so an
all-zero report would describe an index the call never disturbed. `.detail` is `undefined` there.

## What did not change

- **`skipped`** — see above.
- **The `'fail'` semantics.** Not asked for, and you rely on the rollback.
- **`IVectorIndex.query`.** Your original option 3 became unnecessary once `size` landed; we did
  not revisit it.
- **The fragment index.** `IFragmentVectorIndex` still has no rebuild report. Its `rebuild` reads
  the new listing shape and drops `excluded` on the floor, because a bare count has nowhere honest
  to put it. When that contract gains a report it gains the rule with it.

  **One thing there did change, and it is a fix you want.** Editing that function surfaced that
  `InMemoryFragmentCosineIndex.rebuild` called `reset()` **before** `list()`, so a transient
  source-read failure silently emptied a healthy fragment index. That is the same data-loss
  ordering the record-granular index had already corrected — and on the durable sibling it was real
  loss, not a hypothetical. A failed list now leaves your fragments intact, matching
  `InMemoryCosineIndex`. No signature change; strictly safer behavior. If you have any retry or
  reconcile path that tolerated an emptied fragment index after a failed rebuild, it will now find
  the index still populated.

## Migration, concretely

Every existing reader breaks, including yours — accepted knowingly by both sides, and cheaper now
than after you build your coverage surface on the old shape.

- `report.indexed` → a map. For the old number, sum it. There is a bucket only for kinds that
  contributed, so an all-declining rebuild leaves `indexed` **empty** rather than zero-valued.
- Same for `declined`.
- `await index.rebuild(...)` still `await`s the same way and `DetailedResult` is assignable to
  `Result`, so `.onSuccess` chains and `toSucceedWith`-style assertions keep compiling. Only an
  *implementation* of `IVectorIndex` has to widen its own return type.
- If you hold an `IMemoryRecordSource` implementation, wrap its list value in `{ records }`.

Both shipped indexes — `InMemoryCosineIndex` and `SqliteVecVectorIndex` — are observably identical
here, failure detail included. The SQLite one stopped deriving `indexed` from a `COUNT(*)` and
tallies in the loop instead, which also removed the one fallible step in assembling the report.
