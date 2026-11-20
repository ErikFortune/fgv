[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryRecordListing

# Interface: IMemoryRecordListing

What a [IMemoryRecordSource.list](IMemoryRecordSource.md#list) call yields: the records the rebuild
should embed, plus — when the source can say — what it filtered out on the way.

## Remarks

The exclusion count originates here because **this is the layer where the
decision is made**. A rebuild never sees an excluded record, so it cannot count
one; a report assembled without this would silently undercount coverage, and
undercount in the direction of looking healthier.

A store accessor answering "how many are excluded right now" was considered and
declined: it answers a *different question* than the report does — "excluded
right now" versus "excluded in this reconcile" — and the two legitimately differ
whenever records are written between reconciles. Two correct-and-unequal numbers
are worse than one absent number: they invite treating a real difference as a
bug, or picking whichever supports the conclusion already held.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-excluded"></a> `excluded?` | `readonly` | `ReadonlyMap`\<[`Kind`](../type-aliases/Kind.md), `number`\> | Records this source filtered out, counted by [Kind](../type-aliases/Kind.md). Omit it entirely if the source does not track exclusions — that reads as *"cannot say"* on [IVectorRebuildReport.excluded](IVectorRebuildReport.md#property-excluded), which is distinct from an empty map (*"nothing was excluded"*). |
| <a id="property-records"></a> `records` | `readonly` | readonly [`IScopedMemoryRecord`](IScopedMemoryRecord.md)[] | Every record the rebuild should embed, each paired with its scoped address. |
