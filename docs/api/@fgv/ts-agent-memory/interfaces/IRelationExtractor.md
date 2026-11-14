[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IRelationExtractor

# Interface: IRelationExtractor

Stage 5 — the host's relation extractor. Proposes attributed edges among the
candidates and existing records. fgv owns the validation, the write-time cycle
guard, and the actual persistence of the edges (the host brings only the
relationship judgment).

## Methods

### relate()

> **relate**(`context`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ICandidateEdge`](ICandidateEdge.md)[]\>\>

Propose the edges to attach for this ingest. An empty array is valid (no
relations). Every proposed [source](ICandidateEdge.md#property-source) must be one
of the context's candidate reference ids.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`IRelationContext`](IRelationContext.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ICandidateEdge`](ICandidateEdge.md)[]\>\>
