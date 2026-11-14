# fgv → PersonAIlity — partial-read `IMemoryIndex` shipped

**Written:** 2026-08-15. Closes [personaility#591](https://github.com/ErikFortune/personaility/issues/591).
Your verdict was **adopt**; this is what landed, including the gap you caught.

**This is the coordination flag.** Flag the alpha that carries it rather than letting it arrive with
the rest of the set.

---

## Your migration is one parameter. Start here.

Your census said you construct our retrievers directly (`actorMemoryVault.ts:47,57,58`) and touch
`IMemoryIndex` nowhere. So:

```ts
// before
RecencyRetriever.create(index)
SemanticRetriever.create({ index, backend })

// after
RecencyRetriever.create({ index, resolver: store })
SemanticRetriever.create({ index, resolver: store, backend })
```

**`IMemoryStore` itself now extends `IMemoryRecordResolver`**, so `resolver: store` type-checks for
the interface handle you hold, not only for a concrete `FileTreeMemoryStore`. We shipped it on the
concrete class first; a review pass caught that your census says you implement against
`IMemoryStore`, which would have made this one-line migration fail to compile for you. Thank you for
stating that in the census — it is the reason it works.

The index projection this design leads with is invisible to you — exactly as your census predicted,
which is why this note leads with the parameter instead.

**Two more things to check, neither of which your census would have flagged:** `store.list()` (see
"the other break" below), and — if you have *any* `IMemoryStore` implementation or test double —
that interface gained a **required `listEntries()`** as well as the resolver method. A structural
mock will not compile.

## You were right about `rebuild`, and it mattered more than either of us said

Adopted verbatim: **`rebuild` takes projected entries, `patch` keeps whole records.** Your framing —
*"rebuild is a whole-vault read that happens to terminate in the index"* — is now the rule on the
contract.

Checked against source while implementing, it is worse than the case you made. `_initialIndex`
collected **every record in the vault, whole, into one array** before handing it to `rebuild`. So
the store's own open path held N whole records at peak, and would have kept doing so under the
draft you reviewed no matter what the index chose to retain. That peak was the resident-memory
moment this whole exercise was about. It is now one record: the walk parses and **fully validates**
each body — preserving what `onRecordError: 'skip'` means, which a naive "parse frontmatter only"
conversion would have silently moved downstream — then projects and discards.

Your note of 2026-08-11 already said this constraint "would need to move with" the read surface. We
did not carry it forward. Thank you for re-raising it rather than assuming we had.

Your two smaller corrections are in as well: the `limit` exemption is now stated as a property of
the **ordering** (it holds only when the ordering key is an envelope field — true of both shipped
comparators, and the next ordering has to earn it), and the unordered-`entries()` clause is called
out as a **behavioural** break distinct from the type break.

## The other break: `list` now requires a selection

You *did* see this — it landed in revision 3 and your adopt verdict is revision 4 — but it is worth
its own section because it is the one thing here that can bite code your census would not have
flagged, and because your census was run against the earlier draft.

```ts
store.list()                       // compile error — the argument is required
store.list({})                     // Result.fail — narrows nothing
store.list({ asOf: 500 })          // Result.fail — asOf projects, it does not narrow
store.list({ kind })               // fine
store.list(scanEveryRecord())      // fine, and says what it costs
store.list(scanEveryRecord({ asOf: 500 }))
```

Because the index holds envelopes, `list` reads one file per returned record — so an unnarrowed
call reads the vault, and that has to be a decision rather than a default. It is `safer-fetch`'s
`addressGuard` / `allowAnyAddress()` idiom on a second surface: it cannot be omitted, and
`grep -rn scanEveryRecord` enumerates every whole-vault read you have.

**It buys explicitness, not a cost bound** — `{ kind: 'knowledge' }` on a knowledge-heavy vault
still materializes most of it. We are not claiming more than that.

**If you only need to select, you do not need any of this:** `listEntries()` returns every entry's
scope and envelope, requires no selection, and reads no files. You told us
`ActorMemoryVault.retrieve` reads the whole vault and applies the query's axes in memory — that is
the call this is for, and pushing the axes down into the selection is what makes it cheap.

The L2 `memory_search` tool enforces the same shape at the model boundary (at least one of `kind` /
`tag` / `semantic` / `limit`). You said you do not expose it, so this is FYI.

## What you get for the parameter

- **`limit` now bounds the READ, not just the result.** With no `query.filter`, ordering and paging
  happen over envelopes and only the page is materialized.
- **`query.filter` still works identically** but costs what it always cost, now visibly: it takes a
  whole record, so every envelope-survivor is read before it can be applied. Pair it with an
  envelope axis when that matters.
- **`IMemoryIndex.get(target)`** — O(1) keyed lookup. `SemanticRetriever` and
  `LinkTraversalRetriever` were each building a `Map` over the entire index, per query, to look up
  at most `topK` entries or a BFS frontier.
- **The conformance rule is stated rather than warned about.** An index is a derived, complete,
  faithful projection: it may change where entries live and how they are found, never which entries
  exist or what an envelope says — because the write path reads it too.

## Two `@public` free functions changed too

Not in your census, because it covered `IMemoryIndex`:

```ts
-indexedRecordMatchesQuery(entry: IIndexedMemoryRecord, query): boolean
+indexedRecordMatchesQuery(entry: IIndexedMemoryEntry,  query): boolean

-selectByQuery(entries: ReadonlyArray<IIndexedMemoryRecord>, query): IMemoryRecord<unknown>[]
+selectByQuery(entries: ReadonlyArray<IIndexedMemoryEntry>,  query): IIndexedMemoryEntry[]
```

`selectByQuery`'s **return type** changed, not just its argument — you get entries back, and
materialize what you need. If you call neither, ignore this.

## One behavioural change no compiler will find

**`entries()` is explicitly unordered now.** The bundled `MemoryIndex` returns `Map` insertion
order, which is stable and observable, so anything that came to depend on it keeps compiling and
changes results. Use the ordered accessors (`byRecency` / `byRank`, or the recency-ordered
`byKind` / `byTag`). Flagged separately from the type break for exactly the reason you gave: a break
that type-checks is the wrong kind.
