[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / guardRetrieverCapabilities

# Function: guardRetrieverCapabilities()

> **guardRetrieverCapabilities**(`query`, `capabilities`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

Enforce the loud-degradation contract for the `semantic` and `asOf` axes
against a retriever's `capabilities`: a requested capability the retriever
does not support fails loudly rather than returning a silent empty result.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | [`IMemoryQuery`](../interfaces/IMemoryQuery.md) |
| `capabilities` | [`IMemoryRetrieverCapabilities`](../interfaces/IMemoryRetrieverCapabilities.md) |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>
