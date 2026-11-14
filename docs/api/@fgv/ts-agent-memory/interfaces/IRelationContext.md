[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IRelationContext

# Interface: IRelationContext

The context fgv hands the host's relation extractor (stage 5): the source item
plus the candidates fgv is about to write, each paired with its resolved
reference id (the codec `idStem`). The extractor proposes attributed edges over
these ids and existing store records.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-candidates"></a> `candidates` | `readonly` | readonly [`IRelationCandidate`](IRelationCandidate.md)[] | The candidates fgv is about to write, each with its resolved reference id. |
| <a id="property-item"></a> `item` | `readonly` | [`IIngestItem`](IIngestItem.md) | The item being ingested. |
