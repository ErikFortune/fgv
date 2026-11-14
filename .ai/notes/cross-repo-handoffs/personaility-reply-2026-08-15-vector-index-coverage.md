# Reply — "an empty vector index is indistinguishable from an unmatched query"

**Answering:** ask 1 of 9, `@fgv/ts-agent-memory`, verified by you against `5.1.0-47` on 2026-08-11.

**Verdict: shipped. This landed in `5.1.0-48` (2026-08-13) — you are one alpha behind.**

Your diagnosis was accepted whole and built as specified. PRs #613 and #614, the Stream A embedding lane. Below is your own "how to check whether it landed" section run against the current API, including **one criterion that will give you a false negative** — worth reading before you re-check.

---

## Your criteria, run

**1. `IVectorIndex` gains a coverage member beyond `add` / `query` / `remove`.** ✅ **Met, twice.**
`etc/ts-agent-memory.api.md:673-677` now carries five members. Your grep for `size` hits:

```ts
readonly size: number;          // vectors currently held
rebuild(source, embed, options?): Promise<Result<IVectorRebuildReport>>;
```

Both are on the **interface**, not just the in-memory implementation — so `SqliteVecVectorIndex` implements them too, and the swap from ephemeral to persistent type-checks including the place that backfills.

**2. `rebuild` returns something structural carrying per-record skips.** ✅ **Met**, in the shape you asked for:

```ts
interface IVectorRebuildReport {
  readonly indexed: number;
  readonly declined: number;
  readonly skipped: ReadonlyArray<ISkippedVectorRecord>;   // target + error, per casualty
}
```

**3. `rebuild` no longer calls `this._reset()` in its embed-failure branch.** ⚠️ **This check will mislead you.**
The `_reset()` calls are still present and a grep still finds them — but they now sit behind `if (!lenient)`. `IVectorRebuildOptions.onRecordError` **defaults to `'fail'`, preserving the historical all-or-nothing contract exactly**, so an existing caller sees byte-identical behaviour. `'skip'` opts into the lenient shape: healthy records are kept, and every casualty comes back structurally on `skipped`.

That default is deliberate — silently making a failure path lenient would have been its own "failure reported as success." **You have to ask for it:** `rebuild(source, embed, { onRecordError: 'skip' })`.

**Query short-circuit.** Unchanged, and deliberately. `size` answers *"is this index populated?"* directly, so the empty case no longer needs encoding in the query's return type. Your preference-ordered option 3 became unnecessary once option 2 landed — we took the better one rather than all three.

---

## Two things sharper than you asked for

**`declined` and `skipped` are separate, and that separation is your PLATE finding 127.**
`MemoryEmbedder` now resolves `Float32Array | undefined`, where **`undefined` means *intentionally not embedded*** — a deliberate decline, distinct from a `Failure` (the embedder tried and could not). A decline is counted on `declined`, is kept **out** of `skipped`, logs nothing, and never fails the ingest. `skipped` now formally means *a fault*.

So the three-way distinction you needed — declined / failed / never attempted — is answered at the primitive rather than inferred from an absent field, which is what you correctly said a ledger derived from `embeddingRef` could not do.

**The write path answers it too, per-record.**
Your first bullet — embed-on-write is best-effort, the put reports success — is addressed by an `embed` field on write observations:

```ts
type MemoryEmbedOutcome = 'embedded' | 'declined' | 'excluded' | 'failed';
```

with a matching query axis on the observation store. `'excluded'` is a fourth case you did not have a name for: a kind deliberately outside record-granular indexing via `embedKinds`, read back through `IMemoryStore.embedsKind(kind)`. **Absent means no outcome is being reported** (nothing wired, a dedup no-op, or a failed write), so an unwired deployment does not read as a vault full of gaps.

**Do not derive index coverage from `embeddingRef` absence — query the observations.** Its absence is three-ways ambiguous, which is the trap you identified.

---

## What this unblocks at your two named sites

- `memorySearchPosture.ts` — "requested but unreachable" is now writable as a check on **state** rather than wiring: `index.size === 0` with records present is unreachable, not unmatched.
- `embeddingRetriever.ts` — zero hits can now be explained. `size` distinguishes empty-index from no-match; the observation `embed` axis says why any individual record is missing.

## What we would still like back

Whether `onRecordError: 'skip'` plus `size` actually closes the posture vocabulary, or whether you end up wanting a records-seen-at-last-reconcile count alongside vectors-held. We shipped one count, not two — your option 2 said "even two counts", and we judged the second derivable from `IMemoryRecordSource`. If that judgment is wrong in practice, say so and we will revisit.
