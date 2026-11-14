[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IFragmentVectorRebuildReport

# Interface: IFragmentVectorRebuildReport

What an [IFragmentVectorIndex.rebuild](IFragmentVectorIndex.md#rebuild) established, resolved by
[Kind](../type-aliases/Kind.md) — the fragment-granular sibling of [IVectorRebuildReport](IVectorRebuildReport.md).

## Remarks

The rule stated on [IVectorRebuildReport](IVectorRebuildReport.md) applies here verbatim and is
not re-opened: **every count is resolved by kind unless there is a stated
reason it cannot be**, `excluded` is optional because only the source can know
it, and the report is carried on a failure as well as a success.

The one member with no record-granular analogue is
[fragments](#property-fragments) — the fan-out. It is
the number that distinguishes this lane: `indexed: 40` says forty records are
represented and says nothing about whether that cost forty embedding round
trips or four thousand, which is the difference between a reconcile that
finishes in a second and one that blocks a request past thirty.

A **declined** record is one whose [FragmentEmbedder](../type-aliases/FragmentEmbedder.md) returned an empty
array — the fragment lane's way of saying *intentionally not embedded*. Note
this is a different mechanism from a [MemoryEmbedder](../type-aliases/MemoryEmbedder.md) decline: an empty
array still performs a real whole-record-replace (which is what clears any
stale fragments), where a record-granular decline skips the index entirely.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-declined"></a> `declined` | `readonly` | `ReadonlyMap`\<[`Kind`](../type-aliases/Kind.md), `number`\> | Records whose embedder intentionally produced no fragments, per kind. |
| <a id="property-excluded"></a> `excluded?` | `readonly` | `ReadonlyMap`\<[`Kind`](../type-aliases/Kind.md), `number`\> | Records the source filtered out before the rebuild saw them, per kind. `undefined` means *this source does not report exclusions*; an empty map means *it does, and excluded nothing*. |
| <a id="property-fragments"></a> `fragments` | `readonly` | `ReadonlyMap`\<[`Kind`](../type-aliases/Kind.md), `number`\> | Fragments held, per kind — the fan-out `indexed` cannot express. |
| <a id="property-indexed"></a> `indexed` | `readonly` | `ReadonlyMap`\<[`Kind`](../type-aliases/Kind.md), `number`\> | Records that ended with at least one fragment held, per kind. |
| <a id="property-skipped"></a> `skipped` | `readonly` | readonly [`ISkippedVectorRecord`](ISkippedVectorRecord.md)[] | Records that failed, per record, with the error — a fault, never a decline. |
