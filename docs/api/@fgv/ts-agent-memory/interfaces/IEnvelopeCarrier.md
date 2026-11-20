[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IEnvelopeCarrier

# Interface: IEnvelopeCarrier

The minimum a temporal helper needs: something carrying an envelope.

## Remarks

Every predicate and selector in this module reads `envelope.temporal`,
`envelope.created` and `envelope.seq` and **nothing else** — no body has ever
been consulted. Taking the structural shape rather than `IMemoryRecord` lets
the same helpers serve both an `IMemoryRecord<unknown>` (which satisfies it)
and an `IIndexedMemoryEntry` from the index's projected read surface, so the
temporal `asOf` projection can run over envelopes and materialize only the
versions that survive it.

The selectors are generic in this shape so they return exactly what they were
given rather than widening to the constraint.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-envelope"></a> `envelope` | `readonly` | [`IMemoryEnvelope`](IMemoryEnvelope.md) | The envelope the temporal predicates read. |
