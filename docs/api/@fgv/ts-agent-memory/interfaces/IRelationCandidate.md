[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IRelationCandidate

# Interface: IRelationCandidate

A candidate paired with its resolved reference id, handed to the relation
extractor so it can source edges from it.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-candidate"></a> `candidate` | `readonly` | [`ICandidateRecord`](ICandidateRecord.md) | The candidate about to be written. |
| <a id="property-id"></a> `id` | `readonly` | [`IEdgeTarget`](IEdgeTarget.md) | Its resolved scope-qualified reference (codec `(scope, idStem)` — the stable entity address). |
