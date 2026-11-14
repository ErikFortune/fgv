[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IVectorRebuildReport

# Interface: IVectorRebuildReport

What a rebuild actually did — the structural answer to "is this index complete?".

## Remarks

A bare count cannot distinguish the ways a record can be absent from the index,
and that distinction is the entire point: **`declined` was intentional,
`excluded` was never offered, `skipped` was a fault, and none of them is the
same as "never attempted"**. A caller deriving coverage from a count alone
cannot tell an embedder outage from a deliberate policy, which is precisely the
confusion this type exists to end.

**Every count in this report is resolved by kind.** A coverage report exists to
answer *"is my coverage what I intended?"*, and a bare total cannot:
`indexed: 500` reads identically whether the right kinds were indexed or a
policy drift silently redirected coverage, and the same is true of every other
count here. Totals are derivable by summing; the per-kind breakdown is not
derivable from anything else — [IVectorQueryHit](IVectorQueryHit.md) carries no `kind`,
[IVectorIndex.query](IVectorIndex.md#query) answers "what is near this" rather than "what is in
here", and [IVectorIndex.size](IVectorIndex.md#property-size) is a scalar, so the index cannot be
interrogated after the fact for any of them. **A new count added to this report
is resolved by kind unless there is a stated reason it cannot be.**

`indexed` is the count most tempting to leave bare and the most dangerous to,
because it is the number a coverage surface actually renders: 500 bookkeeping
rows and zero knowledge rows is a healthy-looking number for a catastrophically
broken index.

**Reading a report that arrived on a failure.** Under
[\`onRecordError: 'fail'\`](../type-aliases/VectorRebuildErrorMode.md) the report is handed
back on the failure's `detail` — *after* the rollback has already run. It
describes the attempt, not the surviving index: `indexed` names what had been
established when the rebuild stopped, and the index itself now holds nothing. It
is a diagnostic ("we were 340 knowledge rows in when the embedder died"), not a
coverage statement. Only a report from a **successful** rebuild describes what
the index holds.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-declined"></a> `declined` | `readonly` | `ReadonlyMap`\<[`Kind`](../type-aliases/Kind.md), `number`\> | Records the embedder deliberately declined (resolved `undefined`), counted by [Kind](../type-aliases/Kind.md). The embedder was called and answered — contrast `excluded`, where it never was. |
| <a id="property-excluded"></a> `excluded?` | `readonly` | `ReadonlyMap`\<[`Kind`](../type-aliases/Kind.md), `number`\> | Records the `source` filtered out before the rebuild ever saw them, counted by [Kind](../type-aliases/Kind.md) — for a store-backed source, the kinds outside [embedsKind](IMemoryStore.md#embedskind). **Optional, and the optionality is semantic rather than cosmetic**: it is the one count a rebuild genuinely cannot know for itself, because the decision is made upstream in the source. `undefined` means *this source does not report exclusions* — distinct from an empty map, which means *this source reports them and excluded nothing*. `indexed` and `declined` are knowable by construction (the rebuild either added the vector or the embedder answered) and so are never optional. |
| <a id="property-indexed"></a> `indexed` | `readonly` | `ReadonlyMap`\<[`Kind`](../type-aliases/Kind.md), `number`\> | Records embedded and added to the index, counted by [Kind](../type-aliases/Kind.md). **Remarks** A count of successful `add` calls, so it lines up with its per-record siblings and the buckets sum back to the listing. It is deliberately **not** read back off [IVectorIndex.size](IVectorIndex.md#property-size) at the end, which no implementation could resolve by kind anyway. The trade that makes: a `source` that lists the same `(scope, id)` twice contributes twice here while the index holds one vector, where a size read would have self-corrected. A source that does that is malformed, and a total that silently disagreed with the per-kind breakdown would be the worse failure. |
| <a id="property-skipped"></a> `skipped` | `readonly` | readonly [`ISkippedVectorRecord`](ISkippedVectorRecord.md)[] | Records whose embedding or add FAILED and were skipped. Non-empty only under [\`onRecordError: 'skip'\`](../type-aliases/VectorRebuildErrorMode.md) — under `'fail'` the first failure aborts the rebuild, so a `'fail'` report names the casualty in its failure message rather than here. Per-record and carrying the error, so it already implies the per-kind breakdown the counts above spell out; that is the stated reason this one field is not a `ReadonlyMap<Kind, number>`. |
