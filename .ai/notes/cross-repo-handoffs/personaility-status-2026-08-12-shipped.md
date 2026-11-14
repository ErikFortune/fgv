# Shipped — the embedding lane is on `release`, plus the write-path axis you were owed

**Follows:** our status note of earlier today, which said four PRs were open and nothing was merged.
**State: merged and published as `5.1.0-48`** (alpha tag, 2026-08-13T04:23Z). An earlier draft of this
note said "not published yet"; the alpha went out between drafting and sending, and you found it before
we told you. Corrected rather than quietly fixed, because "we will tell you the version rather than
leave you to discover it" is exactly what we promised and exactly what we then failed to do.

**Keep tracking `@alpha`.** That is the supported channel for you and will stay that way until 1.0 —
this is not a workaround and there is no tag change coming that makes a plain `npm install` give you
current code. We have described the `latest` situation to you before in a way that implied otherwise;
that was wrong and this replaces it.

**What is actually wrong with `latest`, narrowly.** On our established packages it points at a real
release, as it should — `@fgv/ts-utils`, `@fgv/ts-extras` and `@fgv/ts-json-base` are all
`latest: 5.0.2`, `alpha: 5.1.0-48`. But on the two packages you depend on most it points at an
**alpha**:

| package | `latest` | `alpha` |
|---|---|---|
| `@fgv/ts-agent-memory` | **5.1.0-36** ← an alpha | 5.1.0-48 |
| `@fgv/ts-agent-memory-sqlite-vec` | **5.1.0-42** ← an alpha | 5.1.0-48 |

Those two have never had a stable release; an accidental publish left an alpha sitting on the tag.
So the harm is not that you get *stale* code — you were never going to install from `latest` — it is
that anyone who does gets **a months-old alpha presented as a stable release**, with no signal that it
is neither. That is worth fixing on its own terms, and it is on us, but it was never the thing
standing between you and `-48`.

---

## What landed

| your item | what shipped | PR |
|---|---|---|
| **4** — embedder cannot decline | `MemoryEmbedder` resolves `Float32Array \| undefined` | #611 |
| **2** — declare which kinds are indexed | `embedKinds` + `IMemoryStore.embedsKind` | #612 |
| **1** — empty index vs unmatched query | `IVectorRebuildReport` + `onRecordError` | #613 |
| **3** — no backfill on the contract | `size` + `rebuild` on `IVectorIndex`, sqlite included | #614 |
| **(new)** — write-path coverage | `embed?: MemoryEmbedOutcome` on write observations | #615 |

**We took item 5 rather than leaving it to you.** Our last note said your original objection survived on
one axis — that on the *write* path, `embeddingRef` absence still could not distinguish *declined* from
*excluded* from *failed*, because the `put`'s own outcome is `success` in all three. That is now a field
and a query axis:

```ts
observations.query({ embed: 'failed' })   // which writes left the index short
```

Four values — `'embedded'`, `'declined'`, `'excluded'`, `'failed'`. **Do not build the ledger.** All four
of the things it would have been for are answered by the primitive now.

---

## Three details you will want, because they change how you read the field

**Absent is not a fifth value.** It means no outcome is being reported: nothing wired, a dedup no-op, or
a **failed** write. That last one is deliberate — an embed step may have run before the failure, and can
even leave an orphan vector for a later `rebuild` to reconcile, but the field answers *"is this **stored**
record in the index?"* and a failed write produced no stored record. An `embed` criterion never matches a
record carrying no outcome, so an unwired deployment does not read as a vault full of gaps.

**`'failed'` means stale, not absent, on an update.** A first write ends up with no `embeddingRef` and
nothing in the index. An **update** keeps the reference and vector it already had — so the index goes on
answering on the record's **previous** content until a rebuild. Both need a re-embed, but only one of them
is silent about it. We got this wrong in our own docs first and are telling you because your coverage
logic will care.

**A decline is unlogged, not unreported.** It still emits no warning — that was the point of item 4 — but
it now reports `'declined'`. Saying nothing at all is what made absence ambiguous in the first place.

---

## Two bugs we found in our own work, disclosed unprompted

**`rebuild` cleared the index before it tried to list records.** A transient list failure therefore wiped
a healthy index and returned a failure having destroyed data for nothing — **durably** on
`SqliteVecVectorIndex`. Fixed in both, with regression tests, and now stated at the seam so a third-party
implementer reads the rule from the stub rather than inheriting the bug.

Two details, since you keep this class of note: a **pre-existing test was pinning the destructive behavior
as intended**, and the package was at **100% coverage the whole time** — every branch ran, but no test had
ever seeded a populated index before a failing list, so the property that mattered was never asserted.

**The decline path pruned its stale vector before the write committed.** A persist that fails leaves the
*previous* body on disk — and that vector is still an accurate embedding of it. So the early prune deleted
a correct vector on behalf of a write that never landed. The prune now runs on the far side of the commit.

---

## What we owe you, unchanged

The mis-set `latest` dist-tag and the 21-of-25 unreachable `types` condition. Both predate this stream and
are still open.

## What would change what we build next

- **Item 6's query shape** — exact-match on a key, subset match, or presence. Tell us before we build it.
- **Item 7's read surface** — breaking, wants its own design; asking now keeps it a choice, not a migration.
- **Anything above that reads wrong in practice.** The `'failed'`-means-stale case in particular is the
  kind of thing that looks fine in a doc and bites in a dashboard.
