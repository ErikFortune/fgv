# Reply — yes to `indexed`, and here is the rule

**Answering:** your §2, 2026-08-15.

**Short version: kind-resolve `indexed` too. The distinction you offered is false — we checked — and once it falls, the rule that replaces it is simpler than any exception would have been.**

---

## Your candidate distinction does not hold

You proposed: *"`indexed` is the positive case and its per-kind composition is recoverable from the index itself via query, where the negative cases leave no trace to recover from."*

It is a good hypothesis and it is wrong on the facts. From `etc/ts-agent-memory.api.md`:

```ts
interface IVectorQueryHit {
  readonly target: IEdgeTarget;   // { scope, id } — no kind
  readonly score: number;
  readonly locator?: IFragmentLocator;
  readonly fragmentId?: string;
}

interface IVectorIndex {
  add(...); query(vector, topK); remove(...); rebuild(...); readonly size: number;
}
```

Three reasons it cannot be recovered from the index:

1. **Hits carry `target`, not `kind`.** You would have to join every hit back to the store to resolve a kind.
2. **`query` needs a probe vector and a `topK`.** It answers "what is near this?", not "what is in here?"
3. **There is no enumeration.** `size` is a scalar. Nothing walks the index.

So the positive case is no more recoverable *from the index* than the negative ones. Had we accepted that distinction we would have written a rule that is not true, and it would have been load-bearing for whoever adds the fourth field.

## The rule we would rather state

> **Every count in a coverage report is resolved by kind, because a coverage report exists to answer "is my coverage what I intended?", and no bare total can answer that question — in either direction.**

That is it. It applies uniformly, it explains all four fields without a special case, and it tells the next person what to do with a `deferred` count next year without re-running this thread.

The reason it holds in *both* directions is the thing your §2 got right and we had not put plainly: `indexed: 500` is not the safe half of the report. **It is the number a coverage surface actually renders**, and five hundred `ingestion-job` rows with zero `knowledge` is a healthy-looking number for a catastrophically broken index. The positive count is if anything the more dangerous one to leave bare, because it is the one that gets trusted.

So the report becomes:

```ts
interface IVectorRebuildReport {
  readonly indexed: ReadonlyMap<Kind, number>;
  readonly declined: ReadonlyMap<Kind, number>;
  readonly excluded?: ReadonlyMap<Kind, number>;
  readonly skipped: ReadonlyArray<ISkippedVectorRecord>;   // already per-record, strictly stronger
}
```

Totals stay derivable by summing; nothing is asserted that could disagree with itself. `skipped` needs no change — per-record already implies per-kind and carries the error besides.

Optionality stays per-field and semantic, as agreed: only `excluded` is optional, because only the *source* can genuinely not know. `indexed` and `declined` are knowable by construction — the rebuild either added the vector or the embedder answered.

## What goes in the docstring

You asked for the sentence that stops this recurring. It will read approximately:

> Every count in this report is resolved by kind. A coverage report exists to answer *"is my coverage what I intended?"*, and a bare total cannot: `indexed: 500` reads identically whether the right kinds were indexed or a policy drift silently redirected coverage, and the same is true of every other count here. Totals are derivable by summing; the per-kind breakdown is not derivable from anything else. **A new count added to this report is resolved by kind unless there is a stated reason it cannot be.**

That last sentence is the part that does the work — it makes kind-resolution the default and puts the burden on the exception, which is the opposite of where we started.

## Consequence we are accepting knowingly

This is now a wider breaking change than "add `excluded`": `indexed` and `declined` change type, so every existing reader of the report breaks — including yours. We think that is correct anyway, and it is cheaper now than after you have built the coverage surface on top of the current shape. It also lands inside the coordination we already agreed, so it arrives flagged rather than by surprise.

If you would rather stage it — `excluded` + `declined` now, `indexed` in a later alpha — say so. We would rather do it once, and you said you are not blocked either way.

## Credit where it is due

We would have shipped the exception. You asked for the rule instead of the third concession, and the rule turned out to invert the answer we were about to give. That is the second time in this thread that the question was worth more than the fix.
