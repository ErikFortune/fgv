[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / ICandidateEdge

# Interface: ICandidateEdge

A stage-5 attributed edge proposal: the [edge](#property-edge) to
add, sourced from [source](#property-source). The source MUST be a
candidate being written in this ingest (edges land on the source record's
`envelope.links`); the edge's `target` must resolve to a sibling candidate or
an existing store record.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-edge"></a> `edge` | `readonly` | [`IEdge`](IEdge.md) | The attributed edge (type / target / optional confidence / provenance). |
| <a id="property-source"></a> `source` | `readonly` | [`IEdgeTarget`](IEdgeTarget.md) | The scope-qualified reference (codec `(scope, idStem)`) of the candidate the edge originates from. |
