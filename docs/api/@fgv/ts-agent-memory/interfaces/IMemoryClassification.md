[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryClassification

# Interface: IMemoryClassification

The host classifier's verdict for an [IIngestItem](IIngestItem.md) (stage 2). Guides the
host's own extractor (stage 3) and supplies the default `kind` / `tags` /
`confidence` fgv stamps when the extractor does not override them.

Extensible: the `[key: string]: unknown` arm lets the host attach an opaque
classification payload without changing this interface.

## Indexable

> \[`key`: `string`\]: `unknown`

Opaque, host-owned extension payload — never interpreted by fgv.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-confidence"></a> `confidence?` | `readonly` | `number` | Optional classifier confidence in `[0, 1]`; flows to `provenance.confidence`. |
| <a id="property-kind"></a> `kind` | `readonly` | [`Kind`](../type-aliases/Kind.md) | The record kind the item classifies as. |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly [`Tag`](../type-aliases/Tag.md)[] | Optional tags the classifier assigns. |
