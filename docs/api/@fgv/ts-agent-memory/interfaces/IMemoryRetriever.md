[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryRetriever

# Interface: IMemoryRetriever

The retrieval contract. A retriever exposes its [capabilities](IMemoryRetrieverCapabilities.md) and answers
[queries](#retrieve), degrading loudly (never silently
empty) when a requested capability is not wired.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-capabilities"></a> `capabilities` | `readonly` | [`IMemoryRetrieverCapabilities`](IMemoryRetrieverCapabilities.md) | The capabilities this retriever exposes. Probe before dispatch. |

## Methods

### retrieve()

> **retrieve**(`query`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\>[]\>\>

Retrieve records matching `query`. Returns a `Result.fail` with a
diagnostic message when the query requests a capability this retriever does
not support (never an empty success).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | [`IMemoryQuery`](IMemoryQuery.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\>[]\>\>
