[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IFactExtractor

# Interface: IFactExtractor

Stage 3 — the host's fact extractor. Turns a classified item into zero or more
[ICandidateRecord](ICandidateRecord.md)s. Each candidate's body is validated against the
kind's registered Converter by fgv before it can reach the store (the typed
validation boundary — no unchecked host data is persisted).

## Methods

### extract()

> **extract**(`item`, `classification`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ICandidateRecord`](ICandidateRecord.md)[]\>\>

Extract candidate records from a classified item. An empty array is a valid
result (the item yielded nothing memorable).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `item` | [`IIngestItem`](IIngestItem.md) |
| `classification` | [`IMemoryClassification`](IMemoryClassification.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ICandidateRecord`](ICandidateRecord.md)[]\>\>
