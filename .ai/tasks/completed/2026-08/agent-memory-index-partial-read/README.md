# agent-memory-index-partial-read — the index holds envelopes, not records

**Status**: 🔵 in flight as of 2026-08-15 — code complete and gated, awaiting merge to `release`.
Breaking on a pre-1.0 surface, reviewed and accepted by PersonAIlity before implementation started.

## Summary

`FileTreeMemoryStore` held every record body resident, and the seam that looked like the fix —
`agent-memory-index-injection-seam`'s `index?: IMemoryIndex` (#582) — was not one.
`LIBRARY_CAPABILITIES.md` said so in as many words: *"an instrumentation seam, not a
resident-memory fix — `IMemoryIndex`'s read surface returns whole records by construction, so any
conforming index still materializes every body."*

The ceiling was in the **contract**, so only a contract change could move it:

```ts
// before — every read carries a body
entries(): ReadonlyArray<IIndexedMemoryRecord>;
byKind(kind): ReadonlyArray<IMemoryRecord<unknown>>;

// after — every read is a projection
entries(): ReadonlyArray<IIndexedMemoryEntry>;   // { scope, envelope }
byKind(kind): ReadonlyArray<IIndexedMemoryEntry>;
get(target): IIndexedMemoryEntry | undefined;    // new, O(1)
```

Selection never needed a body. Twelve in-repo `entries()` call sites, and **every one selects on
envelope fields alone** — `scope`, `kind`, `id`, `tags`, `contentHash`, `provenance.source`, `links`,
`temporal`; not one reads `body`. (Most are `.filter`; `listScoped`, `_findByContentHash` and two
retrievers iterate or `.find` instead. The shape varies, the fields read do not.) Returning whole
records made *every conforming index* hold *every body* by construction — so the fix is to remove
that from the contract rather than from one implementation.

**`patch` writes, `rebuild` reads.** `patch` still takes a whole record (its caller is mid-write and
holds one; it is also the one point a body-derived index could observe content without a re-read).
`rebuild` takes **projected entries** — it is a whole-vault *read* that happens to terminate in the
index, and requiring records there forced every caller, the store's own open path included, to
materialize N bodies to feed a structure that projects the envelope back out.

Bodies now resolve on demand through a one-method **`IMemoryRecordResolver`**, which the store
implements and every retriever takes. A lazy `body` getter was rejected: it would have kept every
call site compiling while turning a memory read into a file read behind an unchanged type.

## The second break, which is the one that will bite

`IMemoryStore.list` now **requires a selection that narrows**. Not in the brief — it entered at
design revision 3, as the answer to "how do we absorb the read-latency cost of materializing on
demand". The accepted answer was not to absorb it but to make it unincurrable by accident. **The
consumer did see it**: their adopt verdict is revision 4, and they volunteered evidence for it from
their own code (`ActorMemoryVault.retrieve` reads the whole vault and applies the query's axes in
memory). It is called out separately here and in the cross-repo note not because it was unreviewed,
but because it is the break their `IMemoryIndex` census could not have flagged.

```ts
store.list()                       // compile error — the argument is required
store.list({})                     // Result.fail — narrows nothing
store.list({ asOf: 500 })          // Result.fail — asOf projects, it does not narrow
store.list({ kind })               // fine
store.list(scanEveryRecord())      // fine, and says what it costs
```

This is `safer-fetch`'s `addressGuard` / `allowAnyAddress()` idiom on a second surface: it cannot be
omitted, and `grep -rn scanEveryRecord` enumerates every whole-vault read in a codebase. **It buys
explicitness, not a cost bound** — `{ kind }` on a vault dominated by that kind still materializes
most of it, and the design says so rather than claiming more.

`listEntries()` is the escape hatch for the majority of whole-vault callers: every entry's scope and
envelope, no selection required, no files read.

## The conformance rule, replacing "only a faithful delegating decorator is safe"

An index is a derived, **complete, faithful** projection — an implementation may change *where*
entries are stored and *how* they are looked up, never *which* entries exist or *what any envelope
says*. The store's write path derives dedup matches, admission cohorts and version histories from
these reads, so an index that hides an entry does not merely hide it from queries: it changes what
the next write does.

**Ordering is not part of the contract, and that is a *behavioural* break the compiler cannot find.**
The bundled `MemoryIndex` returns `Map` insertion order, which is stable and observable, so code
that came to rely on it keeps compiling and changes results. Flagged separately from the type break
for exactly that reason.

## Files changed

| file | what |
|---|---|
| `packlets/index/memoryIndex.ts` | the contract: `IIndexedMemoryEntry`, projected reads, `get()`, projected `rebuild`, the conformance invariant |
| `packlets/types/recordResolver.ts` | **new** — `IMemoryRecordResolver`, the one-method body seam |
| `packlets/types/temporal.ts` | widened to a structural `IEnvelopeCarrier` with generic selectors, so `asOf` projects over envelopes |
| `packlets/store/listSelection.ts` | **new** — `MemoryListSelection`, `scanEveryRecord()`, `isWholeVaultScan` |
| `packlets/store/memoryStore.ts` | **new** — `IMemoryStore` extracted, which is what kept fileTreeMemoryStore under the 2000-line `max-lines` cap (1991 at the branch point, 1931 at close) |
| `packlets/store/fileTreeMemoryStore.ts` | required-and-narrowing `list`, `listEntries`, `resolveRecord`, parse→validate→project→discard open path, drop-tolerant vs fail-loud materialization |
| `packlets/retrieve/*.ts` | `IRetrieverCreateParams { index, resolver }`; `query.filter` moved after materialization |
| `packlets/tools/memoryTools.ts` | `memory_search` requires at least one of kind / tag / semantic / limit |
| `packlets/ingest/orchestrator.ts` | reads the projected surface |
| `perf/residentMemory.js` | **new** — the §7 measurement, a script rather than a gated test |
| `src/test/helpers/inMemoryRecordResolver.ts` | **new** shared test resolver — a partial resolver cast into place is the mock-shape contagion `CODING_STANDARDS.md` names |
| `samples/testbed/src/scenarios/memoryToolsGate/index.ts` | threaded `resolver: store` |
| `etc/ts-agent-memory.api.md` | regenerated |
| `.ai/instructions/LIBRARY_CAPABILITIES.md` | the "instrumentation seam" sentence the brief quoted, replaced |
| `.ai/instructions/TESTING_GUIDELINES.md` | **new § "Measurement Harnesses"** — where the heap-measurement lesson below is durably recorded |
| `docs/FUTURE.md` | the `listScoped` eviction window; the body-cache question |
| `docs/TECH_DEBT.md` | the shared-contract / `samples/testbed` entry, third firing recorded |

## Decisions made during execution

**`limit` bounds the READ, not just the result — but only under a stated condition.** With no
`query.filter`, ordering and paging run over envelopes and only the page is materialized. That holds
because both shipped comparators order on envelope fields; an ordering keyed on a body field would
have to sort after materialization. The exemption is therefore stated as a property of **the
ordering**, so the next comparator has to earn it. (Consumer correction, adopted.)

**`query.filter` still works identically and now costs visibly what it always cost.** It takes a
whole record, so every envelope-survivor is read before it can be applied. Documented rather than
removed; pair it with an envelope axis when the read cost matters.

**`listScoped` changed cost and failure mode, and this touches a seam the brief put out of scope.**
Before, it read **nothing** and could not fail — the index held the records themselves, so it just
projected them. Now the index holds envelopes, so it reads a file per record and is fallible. Since
it is the sole feed for `asRecordSource()`, **every `IVectorIndex.rebuild` now costs a full-vault
read it did not previously cost, and can now fail from an unreadable file** (and a `list` failure is
fatal under both `onRecordError` modes). The brief said the vector seam was untouched here; its
*contract* is, but its feed's behaviour is not, and that is worth naming rather than discovering.

**It fails loudly rather than dropping.** A drop-tolerant version was written first and reverted: a
record dropped there lands in none of `records` / `excluded` / `indexed` / `declined` / `skipped`, so
a caller computing coverage undercounts **in the direction of looking healthier** — verbatim the
failure `vectorRecordSource`'s own tally exists to prevent, reintroduced one layer down. The
motivating race is real (`listScoped` holds no write lock, so a concurrent cap-cull eviction can
remove a record mid-read) but a loud failure is recoverable and a silent undercount is not. **The
right fix is to make the loss countable, not to swallow it** — filed in `docs/FUTURE.md`.

`_resolveRequired` is the fail-loud materializer; `_materialize` is the drop-tolerant one, for
readers where a record that vanished between selection and materialization is a miss. `get()`'s
versioned path uses the fail-loud one without holding the lock, and is safe only because temporal
kinds never physically delete a version — **if eviction is ever added to the temporal path, that
caller must change.** That precondition is on the method's docstring, not only here.

**`IMemoryStore` extends `IMemoryRecordResolver`.** The documented wiring is
`{ index, resolver: store }`, and the consumer holds an `IMemoryStore`, not a
`FileTreeMemoryStore` — so leaving `resolveRecord` on the concrete class only would have made the
one-line migration fail to compile for the handle they actually have.

**The measurement is a script, not a gated test.** The design proposed
`src/test/perf/residentMemory.test.ts` "excluded from the coverage gate". A test that must be
excluded from the gate is a signal it does not belong in the suite: it would put a
machine-dependent number behind CI and make CI's runtime a function of N.

## What it measures, and what it cost to measure honestly

```
N=2000 records, body=4 KiB → 7.8 MiB of body

what the index retains, same corpus:
  whole records (before):     9.0 MiB
  projected entries (after):  1.1 MiB   → 88.3% reduction
store open (400 entries, 1.6 MiB of body): 0.3 MiB → 17.3% of body volume
```

The design predicted in advance that a miss would mean *the design* was wrong rather than the
threshold too high. It holds, and 17.3% is inside its `< 25%` bar.

**The harness printed confident, meaningless numbers twice before it was right**, and both failure
modes generalize:

- **A corpus shared between the two passes measures nothing.** The shared array retains every body,
  so the whole-record map costs one pointer per entry and the A/B reports no difference — for
  entirely the wrong reason. Each pass must mint its own records and drop its own references.
- **`padEnd`-built bodies are not resident at all.** 2000 4-KiB `padEnd` strings measured **1.15 MiB**
  of the 8.2 MiB of characters they contain, and freeing all of them released **0.04 MiB** — V8
  shares the padding's backing store. Random hex retains and releases exactly its own size.

**Any future memory harness in this repo should sanity-check that its fixture frees what it claims
to hold before trusting a single number it prints.**

## Two reversals, kept visible

**Draft 1 recommended DELETING four `@public` accessors** (`byKind` / `byTag` / `byRecency` /
`byRank`) on the strength of an in-repo call-site census showing zero callers. That is not a
meaningful measure in a **published utility library** — a `@public` method with no internal callers
is the normal shape of API that exists *for* consumers, and this repo cannot see theirs. The census
measures whether the *internal refactor is blocked*, and nothing else. Corrected to projection,
which preserves every capability and lifts the ceiling just as completely. Recorded as design OQ-2
so it is not re-litigated. The consumer's later census happened to confirm they call none of the
four — which does **not** retroactively vindicate the deletion argument, because the reasoning was
wrong independent of the answer.

**`rebuild` was classified as a write** because it sits beside `patch`. The consumer caught it.
Checked against source it was worse than the case they made: `_initialIndex` collected **every
record in the vault, whole, into one array** before handing it to `rebuild`, so the store's own open
path held N whole records at peak no matter what the index chose to retain. **That peak was the
resident-memory moment the stream existed for.** It is now one record — the walk parses and fully
validates each body (preserving what `onRecordError: 'skip'` means, which a naive "parse frontmatter
only" conversion would have silently moved downstream) and then discards it.

## Coordination

Cross-repo note: `.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-15-index-partial-read-shipped.md`.
It leads with the migration — retriever construction widens from `(index)` to
`({ index, resolver: store })`, and that is the whole of it — and treats the index projection this
design leads with as background, because their census showed they touch `IMemoryIndex` nowhere. The
`list` break is called out separately as the one thing their census would not have flagged, since it
was not in the draft they reviewed.

**Flag the alpha that carries this** rather than letting it arrive with the rest of the set; their
bump tooling takes the whole `@fgv` set at once.

## Carried-forward item from the brief, dispositioned

The brief asked this stream to either commission an independent `code-reviewer` pass over #582's
diff (which had only a self-review) or record why it declined. **Declined:** this stream rewrote
that seam's entire read surface and re-derived what the store does with an injected index, including
every write-path read, which is where a #582 defect would have lived. A retroactive pass would be
reviewing code that no longer exists in that shape. The independent pass that *was* commissioned
covers the superseding surface.
