[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / ICandidateRecord

# Interface: ICandidateRecord

A host-extracted candidate record (stage 3 output). The host supplies the
full envelope MINUS the [store-stamped](../type-aliases/StoreStampedEnvelopeField.md) (fgv derives `id` from the codec; the store stamps the rest) plus the
typed body. Every candidate body is validated against the kind's registered
Converter before it can reach the store (the typed validation boundary).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-body"></a> `body` | `readonly` | `unknown` | The per-kind body (a markdown string in v1), validated on ingest. |
| <a id="property-envelope"></a> `envelope` | `readonly` | `Omit`\<[`IMemoryEnvelope`](IMemoryEnvelope.md), [`StoreStampedEnvelopeField`](../type-aliases/StoreStampedEnvelopeField.md)\> | The host-supplied envelope, minus the store-stamped fields. |
