# Design — `agent-memory-index-partial-read`

**Status: ACCEPTED AND IMPLEMENTED** (2026-08-15). Reviewed by the consumer
([personaility#591](https://github.com/ErikFortune/personaility/issues/591#issuecomment-5300958489),
verdict **adopt**) and shipped in full: every item of §8's recommendation landed, including §7's
measurement — see the appended § "7a. What the measurement actually said". The revision notes below
are kept because two of them record reasoning that was *wrong* and was corrected, which is the part
worth not re-deriving.

> **Revision 2 (2026-08-15), after review feedback.** Draft 1 argued that four read methods had
> "zero production callers" and should therefore be **deleted**. That reasoning was wrong, and
> wrong in a way worth keeping visible: this is a **published utility library**, so a call-site
> census over this repo measures whether the *internal* refactor is blocked and nothing else. A
> `@public` method with no in-repo callers is, if anything, *more* likely to exist for external
> consumers than less. §1 now says what the census actually establishes, and §2 replaces deletion
> with projection — which turns out to be the better design on its own merits, not merely the safer
> one.
>
> **Revision 3 (2026-08-15), after review feedback.** OQ-3 asked how to absorb the read-latency cost
> of materializing on demand. The answer accepted in review is not to absorb it but to **make it
> impossible to incur by accident**: a selection is *required*, an empty one *fails*, and a caller
> who genuinely wants the whole vault says so by name. See §5a. That closes OQ-3 and reshapes
> `IMemoryStore.list` and `IMemoryQuery`, so it widens the stream beyond `IMemoryIndex`.
>
> **Revision 4 (2026-08-15), after the consumer's reply**
> ([personaility#591](https://github.com/ErikFortune/personaility/issues/591#issuecomment-5300958489)).
> Verdict: **adopt**. OQ-1 is answered with a census (§8). One real gap accepted: `rebuild` was
> classified as a write because it sits beside `patch`, and it is not — see §2a. Two smaller
> corrections adopted: the `limit` exemption is restated as a property of the ordering (§5a), and
> the ordering clause of the §6 invariant is called out as a **behavioural** break distinct from the
> type break.

---

## 1. What I measured first, because it changes the design

Before proposing anything I took a census of **every** read of `IMemoryIndex` in the repo. Twelve
call sites. Three findings, all of which the brief could not have known, and which together make
the change smaller than it looks — **provided the census is read for what it can establish.** It is
a *tractability* measure over this repo, not a usage measure over the library's consumers; draft 1
conflated the two and §8 OQ-2 records the general form of that mistake.

### Finding 1 — every internal read goes through `entries()`; the grouped accessors are used only externally, if at all

```
byKind   → 0 in-repo callers outside memoryIndex.test.ts
byTag    → 0
byRecency→ 0
byRank   → 0
entries  → 11
backlinks→ 1
```

**What this establishes is narrow, and draft 1 overclaimed it.** `@fgv/ts-agent-memory` is a
published library; these four are `@public` members of an exported interface. The census says *no
in-repo code path is blocked by changing them* — which is what makes the refactor tractable. It is
**not** evidence that they are unused, and for a utility library it barely leans that way: a method
with no internal callers is the normal shape of API that exists **for** consumers. These four read
as a deliberate query surface ("records of this kind, in recency order"), not as accreted cruft.

What the census *does* establish, and what actually matters here: all four return
`ReadonlyArray<IMemoryRecord<unknown>>`, so **any conforming index must be able to hand back whole
records grouped four different ways** — and no in-repo caller depends on that, so the return type
can be projected without a cascade. `byRank`'s docstring advertises "a bounded top-M page from the
in-memory index with no full-vault scan", a capability no in-repo path uses but which an external
consumer plausibly does — and which projection *preserves*, while deletion would destroy.

The obligation to hold bodies comes from the **return type**, not from the methods existing. Change
the type, keep the capability.

### Finding 2 — selection never reads the body; materialization is a separate, smaller need

Every one of the eleven `entries()` sites is `entries().filter(predicate)`, and **every predicate
reads only envelope fields** — `scope`, `kind`, `id`, `tags`, `contentHash`, `provenance.source`,
`links`, `temporal`. Not one filters on `body`.

There is exactly one exception, and it is worth naming precisely because it is the one thing that
constrains the answer: **`IMemoryQuery.filter` is `(record: IMemoryRecord<unknown>) => boolean`**
(`retriever.ts:268`), a consumer-supplied predicate over the whole record. It is applied inside the
shared pre-filter, so today it runs against every record in the vault. §5 deals with it.

What each site does *after* selecting:

| call site | selects on | needs bodies for |
|---|---|---|
| `store.list(filter?)` | scope / kind / tag | **all survivors** — it is the query surface |
| `store.listScoped()` | nothing | **all records** — feeds the embedder |
| `_versionsForEntity` | scope | all survivors (version merge/compare) |
| `_admissionCohort` | scope + kind + id | all survivors (policy merge / cull) |
| `_findByContentHash` | scope + contentHash + id | **exactly one** — the match it returns |
| `_reconcileRankLocked` | kind | **none** — it only needs `(scope, id)` |
| `RecencyRetriever` / `TagRetriever` / `StructuredFilterRetriever` | envelope + `query.filter` | survivors |
| `temporalRetrievers` | `isTemporalRecord` + envelope | survivors |
| `SemanticRetriever` | **nothing** | **≤ `topK`** |
| `LinkTraversalRetriever` | **nothing** | **none** — reads `envelope.links` only |
| `backlinks` | — | none |

### Finding 3 — the two worst offenders are worst for a reason the brief did not name

`SemanticRetriever` (`:124-128`) and `LinkTraversalRetriever` (`:134-140`) each build a
`Map<edgeTargetKey, IIndexedMemoryRecord>` over **the entire index** — and then use it to look up a
handful of keys: at most `topK` hits in the semantic case, the BFS frontier in the traversal case.

They do that because **`IMemoryIndex` has no by-key lookup.** Its primary key is `(scope, id)`,
`MemoryIndex` stores exactly that map internally as `_byKey`, and the contract does not expose it.
So every caller that wants one entry rebuilds the whole map.

This is a bigger, cheaper win than the body projection, and it is not a memory fix at all — it is
an O(N)-per-query → O(1) fix that happens to also stop N record references being materialized into
a transient map on every semantic query.

---

## 2. (a) What the partial read returns

**Recommendation: a scope-qualified envelope, as a new named type. Not a lazy record, not a thunk.**

```ts
/**
 * An index entry: the record's scope plus its envelope. NO body — the index is a
 * derived selection structure, and nothing that selects has ever needed one.
 */
export interface IIndexedMemoryEntry {
  readonly scope: MemoryScopeKey;
  readonly envelope: IMemoryEnvelope;
}
```

`IIndexedMemoryRecord` (scope + whole record) **stays**, but on `patch` only — see §2a, which
corrects what draft 3 said here.

### Alternatives considered and rejected

- **A lazy record whose `body` is a getter/thunk.** Rejected. It keeps the type
  `IMemoryRecord<unknown>`, so every existing call site compiles unchanged — and that is precisely
  the problem: a caller cannot tell by looking whether touching `.body` is free or a disk read, and
  the compiler will not tell them either. It converts a loud breaking change into a silent
  performance cliff. It also makes `body` access fallible in a property, which the Result pattern
  has no way to express.
- **`Partial<IMemoryRecord>` / an optional `body?`.** Rejected for the same reason plus a worse one:
  `body?: unknown` is indistinguishable from a record whose body legitimately *is* `undefined`.
- **A separate `IMemoryIndexEntryRef` alongside the existing type, with both live.** Rejected: two
  read shapes means every future read method has to pick one, and a caller reading the interface has
  to learn which methods are cheap. Uniformity is most of the value here — one element type across
  every read means "the index does not hold bodies" is a property of the contract rather than of
  five methods out of six.

### 2a. `rebuild` is a read, not a write — the consumer's catch

Draft 3 kept both `patch` and `rebuild` on whole records and called the rule *"write whole, read
projected"*. The consumer rejected that, and they are right:

> *"The underlying error is classifying `rebuild` as a write because it sits next to `patch`:
> **rebuild is a whole-vault read that happens to terminate in the index.**"*

The collision is direct. §5a promises *"whole-vault is free if you take envelopes"* while §2 required
whole records to rebuild — so a persisted index refreshing itself would have had to call
`scanEveryRecord()`, materialising every body, **purely to feed a structure that projects the
envelope back out and discards them.** The design would have shipped with its two halves
contradicting each other.

It is also not a new finding. It is in the ask's own note of **2026-08-11**, which said this
constraint *"is the same materialise-everything constraint the read surface has, on the write side,
and it would need to move with it."* I did not carry it forward. That is the failure mode this
repo's own conventions keep naming — a constraint recorded in one artifact and not read by the work
that needed it.

**Adopted:** `rebuild` takes `ReadonlyArray<IIndexedMemoryEntry>`.

**`patch` stays on whole records**, and the asymmetry is now justified by cost rather than by a
false symmetry: `patch` carries **one** record that the store already holds at write time, so
passing it whole is free — and it is the single moment at which a future body-derived index (a
full-text view, say) could observe content without a re-read. `rebuild` carries N and would pay N
body-reads for nothing. The rule is therefore **`patch` writes; `rebuild` reads** — which is what
the method names would have said if either of us had read them that way.

### This fixes fgv's own open path, which is the bigger half

The consumer framed this as unblocking an *injected persisted* index. Checked against source, it is
more than that. `_initialIndex` (`fileTreeMemoryStore.ts:1917`) calls `_collectEntries`, which
returns `ReadonlyArray<IIndexedMemoryRecord>` — **every record in the vault, whole, in one array** —
then hands it to `rebuild` and walks it again for the `seq` high-water mark. So the store's own open
path holds N whole records at peak *today*, transiently, and would have kept doing so under draft 3
no matter what the index chose to retain. **That peak is the resident-memory moment this whole
stream is about**, and only a projected `rebuild` removes it.

**One caveat that must not be lost in the conversion.** Open currently parses each file *and
validates its body* through the registry, which is what gives `onRecordError: 'skip'` its meaning —
a corrupt body is caught at open, not at first read. A naive "parse frontmatter only" conversion
would silently move that failure downstream. The conversion must instead be **parse → validate →
project → discard, per file**, so peak body residency is one record rather than N *and* the
open-time validation guarantee survives untouched. Stated here because it is exactly the kind of
constraint that gets discovered by a broken test three weeks later.

### The full proposed contract

```ts
export interface IMemoryIndex {
  // — `patch` writes (one record, already in hand); `rebuild` reads (N, projected) —
  rebuild(entries: ReadonlyArray<IIndexedMemoryEntry>): Result<number>;
  patch(op: MemoryIndexPatchOp, entry: IIndexedMemoryRecord): Result<IIndexedMemoryRecord>;

  // — read side: same methods, projected element type —
  /** Every indexed entry, envelope only. */
  entries(): ReadonlyArray<IIndexedMemoryEntry>;

  /** Entries of the given kind, in recency order. */
  byKind(kind: Kind): ReadonlyArray<IIndexedMemoryEntry>;
  /** Entries carrying the given tag, in recency order. */
  byTag(tag: Tag): ReadonlyArray<IIndexedMemoryEntry>;
  /** All entries in recency order. */
  byRecency(): ReadonlyArray<IIndexedMemoryEntry>;
  /** All entries by rank descending, recency tiebreak, absent-rank last. */
  byRank(): ReadonlyArray<IIndexedMemoryEntry>;

  /** NEW. One entry by scope-qualified address. O(1); the index already keys on this. */
  get(target: IEdgeTarget): IIndexedMemoryEntry | undefined;

  /** Unchanged — already body-free. */
  backlinks(target: IEdgeTarget): ReadonlyArray<IEdgeTarget>;
}
```

**Every existing read method survives; only the element type changes**, uniformly, in the one way
that lifts the ceiling. The grouped accessors become *cheaper and more useful* under projection —
envelope-only and pre-grouped, they are now a genuinely efficient answer to "which records of this
kind, most recent first", which is what they always looked like they were for. `byRank`'s
"bounded top-M with no full-vault scan" claim becomes true in a stronger sense than before.

One method is added (`get`), removing the two full-index scans in Finding 3.

A consumer's migration is then a single mechanical shape everywhere: `x.record` → `x.envelope` for
selection, plus a resolve call where they actually need a body. That is a smaller and far more
legible break than "four methods are gone; rebuild them from `entries()`".

---

## 3. (b) Who fetches the body, and through what

**The store does. The index never learns about the `FileTree`, and no resolver is injected into
it.** The brief asked whether a resolver callback at index construction is "a cycle in disguise" —
it is, and the census says it is also unnecessary: the index is not the layer that wants bodies.

The store already has the fetch path: `_readRecord(scope, idStem)` (`fileTreeMemoryStore.ts:1749`),
which resolves the scope dir, finds `<idStem>.md`, parses and verifies. It is **`Result`-returning
and synchronous** — no async ripple.

So `store.list()` becomes select-then-materialize:

```ts
this._index.entries()
  .filter(/* envelope-only predicate, unchanged */)
  .map((entry) => this._readRecord(entry.scope, entry.envelope.id))
  // mapResults, per the repo's array convention
```

### But the retrievers hold an `IMemoryIndex`, not a store

`RecencyRetriever.create(index)`, `TagRetriever.create(index)`,
`StructuredFilterRetriever.create(index)`, `LinkTraversalRetriever.create(index)`,
`SemanticRetriever.create({ index, backend })` — all take the index directly and all return
`IMemoryRecord`s. This is the real decision in (b), and there are three shapes:

- **b1 — a narrow resolver seam the store implements.** `IMemoryRecordResolver` with one method,
  `resolve(scope, id): Result<IMemoryRecord<unknown> | undefined>`; retriever factories take
  `{ index, resolver }`. The store passes `this`. It is one method, it is the store's existing
  private method promoted, and it does not give a retriever the store's write surface.
- **b2 — retrievers take the store.** Rejected: it hands every retriever `put` and `delete`, and
  inverts the current dependency direction (the store constructs retrievers today, not the reverse).
- **b3 — `IMemoryRetriever` returns entries, and the caller materializes.** The most honest shape —
  retrieval answers *which* records, materialization is a separate concern — but it breaks the L2
  agent-tool surface and L3 ingest, and pushes the same resolver problem out to every consumer
  instead of solving it. It is the right end state if retrieval ever grows paging; it is too much
  for this stream.

**Recommendation: b1**, with `FileTreeMemoryStore` implementing `IMemoryRecordResolver` and the
retrievers' `create` widening from `(index)` to `({ index, resolver })`.

---

## 4. (c) The write path — the long-fuse regression

Four write-side consumers derive from the index. Checked against source, not against the brief's
list:

| path | what it needs | under the new contract |
|---|---|---|
| `_findByContentHash` (dedup) | scope + `contentHash` + id ≠ excludeId; returns **one** record | **strictly better** — selects on envelope, materializes the single match instead of holding N bodies |
| `_admissionCohort` (cap-cull / merge) | scope + kind + id ≠ stem; returns the cohort | select on envelope, then `mapResults` the cohort. Cohorts are per-`(scope, kind)` and bounded by the cull cap — small by construction |
| `_versionsForEntity` (temporal) | scope; returns every version | select on envelope, materialize. Bounded by an entity's version count |
| `_reconcileRankLocked` | kind; needs only `(scope, id)` | **no materialization at all** — a pure win, and it currently holds every record of a kind for nothing |

**None of these is starved by an envelope-only read surface**, because none of them *selects* on a
body. Two get strictly cheaper. That is the finding that makes this change tractable rather than
dangerous — and it is the opposite of what the brief feared, so it deserves a skeptic in review.

**The gate that must exist**, and which the brief is right to demand: tests that drive dedup,
cap-cull admission, and temporal versioned put/delete **through the store's public API** and assert
the resulting vault state — not tests that assert the index returns the right entries. A
retrieval-shaped test suite would pass while any of these silently regressed.

---

## 5. `IMemoryQuery.filter`, which is the one genuine casualty

`filter?: (record: IMemoryRecord<unknown>) => boolean` runs inside `indexedRecordMatchesQuery`,
i.e. during selection over every entry. With envelope-only entries it cannot.

**Recommendation: keep `filter` with its current signature and move it after materialization of the
envelope-pre-filtered set.** So a query becomes: envelope pre-filter (`scope` / `kind` / `kinds` /
`tag` / `provenanceSource`) → materialize survivors → `filter` → order → page.

- Semantics are preserved exactly for every query that also carries an envelope axis.
- A query whose **only** axis is `filter` still materializes the whole vault — unavoidable, honest,
  and no worse than today.
- Rejected: narrowing to `(envelope) => boolean` plus a new `bodyFilter`. It is a sharper contract
  but breaks every existing consumer predicate silently if they happened to read `body` — the
  compiler would accept `(record) => …` against `(envelope) => …` for any predicate that only
  touches envelope fields, which is most of them. A break that type-checks is the wrong kind.

This must be called out in `LIBRARY_CAPABILITIES.md`: **`filter` is now a post-materialization
predicate, so pair it with an envelope axis when you care about the read cost.**

---

## 5a. Selection is required; the whole-vault read must name itself

**Accepted in review, and it supersedes the mitigation §8/OQ-3 was reaching for.** The design's real
cost is that `list()` over an unfiltered vault now reads N files where it read zero. The response is
not to make that cheap. It is to stop it happening silently.

### The rule

- `IMemoryStore.list(selection)` — the parameter becomes **required**. Omitting it is a compile
  error.
- A selection carrying **no narrowing axis** (`{}`, or only `asOf`, which projects rather than
  narrows) is a **`Result.fail`**, whose message names the opt-out.
- The opt-out is a named, deliberately uncomfortable value: **`scanEveryRecord()`**.

This is not a new idiom in this repo — it is `safer-fetch`'s, applied to a second surface.
`addressGuard` is required with no default *"so omitting it is a compile error: the one mechanism
that reliably prevents a guarantee being implied but not delivered, and it makes every call site's
posture greppable in one search"*, and `allowAnyAddress()` is *"the named, deliberately
uncomfortable opt-out"*. Same argument, same shape, same two properties: it cannot be omitted, and
`grep -rn scanEveryRecord` enumerates every whole-vault read in a codebase.

The name should say what it costs. `scanEveryRecord()` over `wholeVault()` / `unfiltered()` for that
reason; alternatives worth a moment in review.

### Why compile-time *and* runtime, rather than a pure type

A pure compile-time guarantee is expressible — make `IMemoryStoreListFilter` an at-least-one-of
union — but it degrades badly: every axis added multiplies the union's arms, and `asOf` (a
projection, not a narrowing) has to be excluded from the count by hand. The hybrid gets the
important half at compile time (you cannot forget the argument) and the rest at runtime through the
`Result` this method already returns. Worth flagging as a deliberate trade rather than an oversight.

### What it does and does not buy

**It buys explicitness, not a cost bound**, and overselling it would be the mistake here.
`{ kind: 'knowledge' }` on a knowledge-heavy vault still materializes most of it. What changes is
that a caller **chose** a shape and a reader can see which callers chose "everything" — which is
exactly the claim `safer-fetch` makes for `addressGuard`, no more.

### The cheap whole-vault read, which is the other half

If the caller only needs to *select*, they should never pay for bodies at all. So alongside the
uncomfortable opt-out, the store gains the comfortable one:

```ts
/** Every entry, envelope only. No bodies, no file reads, no selection required. */
listEntries(): ReadonlyArray<IIndexedMemoryEntry>;
```

**Most whole-vault callers want this**, and the census says so — see the two below. The shape of the
rule is therefore: *whole-vault is free if you take envelopes; whole-vault with bodies is possible
but must be named.*

### Two callers this immediately indicts

**1. `MemoryIngestOrchestrator` snapshots the entire store on every `ingestItem` call**
(`ingest/orchestrator.ts:280` — `await this._store.list()`, then a `byKey` map over everything).
Per item. It is the heaviest unfiltered read in the library and it is on the *write* path, which is
where the cost compounds. Under this rule it must declare itself — and most of what it does with the
snapshot (edge-target existence, the cycle guard's link walk, scoped-address keying) is envelope-only
work that `listEntries()` serves for free. Stage-4 layer-1's exact `{ kind, body }` match is the part
that genuinely needs bodies, and it needs them for *candidates*, not for the whole vault.
**Converting that call site is in scope for this stream** and is probably the single largest win in
it — larger than the index projection, because it is per-item rather than per-open.

**2. `memory_search`'s tool schema makes every axis optional** (`tools/memoryTools.ts:238-243`:
`kind` optional, `limit` optional), so a model can issue a completely unfiltered query. Today that
quietly scans the vault; under this rule it fails at the tool boundary. That is the right outcome and
it forces a decision the schema is currently ducking: either require an axis, or have the tool
declare the scan on the model's behalf. **Recommend requiring an axis** — an LLM asking for
"everything" is nearly always an under-specified query, not an intended full scan.

### `IMemoryQuery` gets the same treatment

`IMemoryQuery`'s axes are all optional too, so the retrievers have the identical hole. Same rule:
a query with no narrowing axis fails, naming the same opt-out. `RecencyRetriever` is the interesting
case — "the most recent N records" is a legitimately unnarrowed query — and `limit` is the axis that
makes it safe.

Draft 3 proposed *"`limit` counts as a narrowing axis for ordered retrievers"* and asked for a
skeptic. The consumer supplied one, and the correction is adopted:

> *"conditional on the ordering key being an envelope field, and the condition is unstated. State it
> as a property of the **ordering** so the next axis has to answer the question rather than inherit
> the exemption."*

Exactly right, and it is the same move that settled the rebuild-report stream: write the rule so the
next person is not re-deciding by re-running the argument. **`limit` narrows only when the ordering
key is an envelope field**, because that is what lets the top-N be *selected* before anything is
materialised. Verified for both shipped comparators — `recencyCompare` reads `updated` / `seq`,
`rankCompare` reads `rank` then falls back to it (`retriever.ts:203-227`); both are envelope-only,
so both qualify today. An ordering that keyed on a body field would have to sort after
materialisation, at which point `limit` bounds the *result* and not the read, and the exemption
must not apply. Phrasing it this way puts the burden on the next ordering to earn its exemption.

### `listScoped()` is already the named whole-vault surface

Its name says what it does, its one in-repo consumer is `asRecordSource()` (which the embedder path
needs bodies for), and it is not a query surface a caller reaches for by accident. Left as-is;
noted so the omission reads as considered rather than missed.

---

## 6. (d) What replaces "only a faithful delegating decorator is safe to inject"

The current rule exists because a **reshaping** index changes write semantics — what a versioned
`put` treats as current, what cap-cull evicts — not merely what reads return. That reason does not
go away; what changes is that the contract can now state the invariant instead of warning about it.

**Proposed replacement, to live on `IMemoryIndex`'s docstring:**

> An `IMemoryIndex` is a **derived, complete, faithful** projection of the vault. Implementations
> may change *where entries are stored* and *how they are looked up*; they may not change *which
> entries exist* or *what any envelope says*.
>
> Concretely: `entries()` must return exactly one entry per record the store has written and not
> deleted, and each entry's `envelope` must be the one the store patched in. An index that filters,
> reorders-and-truncates, deduplicates, or synthesizes entries is not a conforming implementation —
> the store's write path derives dedup matches, admission cohorts and version histories from these
> reads, so an index that hides an entry does not merely hide it from queries, it changes what the
> next write does.
>
> Ordering is **not** part of the contract: `entries()` may return any order, and every caller that
> needs one sorts explicitly.

**And that clause is a behavioural break, which must be called out separately from the type break.**
The consumer's objection, adopted:

> *"declaring `entries()` unordered is right, but a consumer relying on today's incidental order
> keeps compiling and changes behaviour. That is the same 'a break that type-checks is the wrong
> kind' objection they raise against narrowing `filter`."*

They are right that I applied that principle in §2 (rejecting a lazy `body`) and in §5 (rejecting a
narrowed `filter`) and then failed to apply it to my own invariant. `MemoryIndex` today returns
insertion order from a `Map`, which is stable and observable; a consumer who noticed that and relied
on it gets no compile error and different results. The migration note must therefore carry **two**
entries — the element-type change, which the compiler finds for you, and the ordering guarantee's
removal, which it does not.

That is stronger than "faithful delegating decorator only" and less restrictive: it permits a
genuinely different implementation (SQLite-backed, lazily-paged) while ruling out the reshaping that
was the actual hazard. **This is the part of the design I would most like challenged** — the current
rule is conservative but unambiguous, and I am proposing to trade unambiguity for expressiveness.

---

## 7. (e) What "lowered" means, and how it is measured

The metric must be resident bytes, and the harness must exist before the change, or the stream ends
with a plausible claim nobody checked. That failure has a precedent in this repo — the
`ai-assist-client-tools` exit artifact claimed a live success nobody had verified.

**Harness:** a new `src/test/perf/residentMemory.test.ts` (excluded from the coverage gate, since it
is a measurement not a behavior test) that:

1. Builds an in-memory `FileTree` vault of N records with a body of a fixed size — proposed
   N = 5,000 and ~4 KiB bodies, i.e. ~20 MiB of body, enough to dwarf envelope and harness noise.
2. `global.gc()` (run under `--expose-gc`), samples `process.memoryUsage().heapUsed`.
3. Opens the store, `global.gc()`, samples again. **Δ is the number.**
4. Asserts `Δ < bodyBytes × 0.25` after the change; records the before figure in `result.md`.

**Predicted result, stated in advance so the measurement can falsify it:** the index drops from
holding N records to N envelopes. Bodies are still materialized transiently by `list()` /
`listScoped()`, but not *retained*. If the measured Δ does not fall by roughly the body volume,
**the design is wrong and this document should be revised rather than the threshold lowered.**

Secondary, cheaper metric worth recording: the semantic-query allocation count, which Finding 3
takes from O(N) to O(topK).

---

## 7a. What the measurement actually said

Run on 2026-08-15 against the shipped code, via `perf/residentMemory.js` (see below for why it is
not the `src/test/perf/residentMemory.test.ts` §7 proposed).

```
N=2000 records, body=4 KiB → 7.8 MiB of body

what the index retains, same corpus:
  whole records (before):     9.0 MiB
  projected entries (after):  1.1 MiB
  reduction:                  88.3%

store open (400 entries, 1.6 MiB of body): 0.3 MiB
  as a fraction of body volume:  17.3%
```

**§7's prediction holds.** It said in advance that if the drop were not roughly the body volume,
*"the design is wrong and this document should be revised rather than the threshold lowered."* The
retained structure falls by 88.3% — the residual 1.1 MiB is envelopes plus `Map` overhead, which is
what is left when the bodies go. The store-open figure, 17.3% of body volume, is inside the `< 25%`
threshold §7 set.

**Two deviations from §7's harness, both deliberate:**

1. **It is a script, not a jest test.** §7 proposed `src/test/perf/residentMemory.test.ts` "excluded
   from the coverage gate". A test that must be excluded from the gate is a signal it does not
   belong in the suite: it would put a machine-dependent number behind CI and make CI's runtime a
   function of N. It lives at `perf/residentMemory.js`, runs on demand under `--expose-gc`, and its
   output is pasted here.
2. **The A/B is between two retaining structures, not before-and-after code.** §7 assumed the
   harness would "exist before the change" so the before figure could be captured against the old
   implementation. It did not, so the comparison is made in one process over one corpus: a `Map` of
   whole records against a `Map` of projected entries. That is the quantity the redesign changes,
   and it does not require the old code to still exist — but it is a *narrower* claim than an
   end-to-end before/after, and should be read as such.

**Two ways this measurement was wrong before it was right**, recorded because both produce a
confident number that means nothing:

- **A shared corpus measures nothing.** Building the records once into an array and then having each
  pass retain from it leaves the array holding every body, so the whole-record map costs one pointer
  per entry and the A/B reports ~no difference — for entirely the wrong reason. Each pass must mint
  its own records and drop its own references as it goes.
- **`padEnd` bodies are not resident.** The first working harness used
  `` `${i}:`.padEnd(4096, 'abc…') `` and measured 2000 such strings as **1.15 MiB** of the 8.2 MiB
  of characters they contain — and freeing all of them released **0.04 MiB**. V8 shares the
  padding's backing store, so the corpus was never resident and both sides of the A/B were noise.
  Random hex retains and releases exactly its own size (7.92 MiB measured for 7.81 MiB of chars),
  and is what the harness uses. **Any future memory harness in this repo should sanity-check that
  its fixture actually frees what it claims to hold before trusting a single number it prints.**

---

## 8. Recommendation and open questions

**Consumer verdict: adopt** ([personaility#591](https://github.com/ErikFortune/personaility/issues/591#issuecomment-5300958489)).
Not blocked; asks only that the alpha carrying it be flagged rather than shipped into a set they
take unawares.

**Recommended:**

0. **`rebuild` takes projected entries; `patch` keeps whole records** (§2a) — `patch` writes,
   `rebuild` reads. This also removes the N-whole-records peak in the store's own open path, which
   is the resident-memory moment the stream exists for, and it must be converted as
   parse → validate → project → discard so open-time body validation survives.
1. **Project the read surface, keeping every method.** `entries()`, `byKind`, `byTag`, `byRecency`
   and `byRank` all return `IIndexedMemoryEntry` (scope + envelope) instead of whole records.
   **Nothing is removed** — the ceiling lives in the return type, not in the methods, so projection
   lifts it while preserving every capability. (Draft 1 recommended deleting four of these on a
   call-site census; that was wrong for a published library — see the revision note and OQ-2.)
2. **Add `get(target)`** — O(1) by scope-qualified address, removing the two full-index scans in
   Finding 3.
3. **Keep the write side on whole records.** `patch` / `rebuild` still take `IIndexedMemoryRecord`;
   the index projects the envelope out. Write whole, read projected.
4. **Resolve bodies in the store**, via a one-method `IMemoryRecordResolver` the retrievers also
   take. The index never learns about the `FileTree`.
5. **Move `query.filter` after materialization** of the envelope-pre-filtered set.
6. **Require a selection, fail on an empty one, name the whole-vault read** (§5a) — plus a free
   `listEntries()` for the majority of whole-vault callers that only need envelopes.
7. **Replace the decorator rule** with the completeness-and-faithfulness invariant in §6 — and
   document its ordering clause as a **behavioural** break, separately from the type break, since
   the compiler cannot find it.

**OQ-1 — ANSWERED.** Asked, and the consumer ran the census against their `working` @ `dbe2519`:

- **They do not reference `IMemoryIndex` at all** — zero occurrences across `libraries/`,
  `services/`, `apps/`. The projection and the grouped-accessor decision cost them nothing.
- **They do not call `byKind` / `byTag` / `byRecency` / `byRank`.** Follows from the above. Note
  this does *not* retroactively vindicate draft 1's deletion proposal — the reasoning was wrong
  independent of the answer, and asking is what produced evidence rather than an inference.
- **They do not implement `IMemoryRetriever`** — they consume one from `getSemanticRetriever()`,
  plus one structural test mock. They flag that their own same-named interface in their runtime
  packlet is a **different type**, so a naive grep of their repo would mislead.
- **They do not expose `memory_search`**, so §5a's tool-schema decision is ours alone.
- **They DO construct our retrievers directly** (`actorMemoryVault.ts:47,57,58`).

**The migration cost is b1's resolver parameter, and nothing else** — not the index change this
design leads with. That inverts the coordination emphasis: the alpha note should lead with
"retriever construction widens from `(index)` to `({ index, resolver })`" and treat the index
projection as background.

They also volunteered evidence *for* §5a from their own code: `ActorMemoryVault.retrieve` reads the
whole vault and applies the query's narrowing axes in memory. The required-selection rule would push
those axes down into the selection — *"making our code better by refusing to compile the wrong
version"*, which is the clearest statement of what §5a is for that either side has managed.

**OQ-2 — settled by the revision, and recorded so it is not re-opened.** Draft 1 asked whether to
delete the four grouped accessors. The answer is **no**: they are `@public` on a published library,
this repo cannot see their consumers, and projection preserves the capability while removing the
ceiling just as completely. Deletion would have bought a slightly smaller interface at the price of
destroying a capability we have no evidence is unwanted — and the evidence we *thought* we had
("nothing calls them") does not mean that in a library.

The general form, worth carrying beyond this stream: **an in-repo call-site census is a
tractability measure, not a deadness measure.** It answers "will changing this cascade through our
own code?" It cannot answer "does anyone rely on this?" for anything `@public`. `ts-agent-memory`
is on the active surface (`ACTIVE_DEVELOPMENT.md`) so breaking is *sanctioned* — but sanction is
permission to break when there is a reason, not a substitute for having one.

**OQ-3 — CLOSED in revision 3, and the answer is better than the question.** The concern was that
with no cache, `list()` on an unfiltered vault reads N files where it read zero, trading resident
memory for read latency on a path that used to be memory-speed. The resolution accepted in review is
not to soften that cost but to make it **unincurrable by accident**: selection required, empty
selection fails, whole-vault-with-bodies named at the call site, and a free `listEntries()` for the
majority of whole-vault callers that only need to select (§5a). Caching stays out of scope, and now
genuinely so rather than as a deferral — a cache would have been a way to make an accidental scan
tolerable, and accidental scans are what this removes.

**OQ-4 (new) — does this widen the stream too far?** §5a reshapes `IMemoryStore.list`,
`IMemoryQuery`, the `memory_search` tool schema and the ingest orchestrator's snapshot — none of
which is `IMemoryIndex`, which is what the brief scoped. The argument for keeping them together is
the one that won on `vector-rebuild-report-by-kind`: they are one break for the consumer instead of
two, and the second would break every call site the first had just made them fix. The argument
against is that the ingest-orchestrator conversion is real work with its own risk surface. **My
lean: keep `list` / `IMemoryQuery` / the tool schema together with the index change, and split the
orchestrator conversion only if it proves large once started.**

## Gates this design commits to

Unchanged from the brief, plus one: **the write-path tests in §4 must drive the store's public API
and assert vault state**, not index contents.
