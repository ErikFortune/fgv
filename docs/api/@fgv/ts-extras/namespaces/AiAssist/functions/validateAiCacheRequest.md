[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / validateAiCacheRequest

# Function: validateAiCacheRequest()

> **validateAiCacheRequest**(`system`, `cache`, `maxBreakpointWrites?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiCacheRequest`](../interfaces/IAiCacheRequest.md)\>

Validates an [IAiCacheRequest](../interfaces/IAiCacheRequest.md)'s `systemBreakpoints` against the `system` string they
index into. Thin wrapper over [validateCacheBreakpoints](validateCacheBreakpoints.md) for a caller that holds the
actual string (every `ts-extras` adapter) rather than just its length.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `system` | `string` |
| `cache` | [`IAiCacheRequest`](../interfaces/IAiCacheRequest.md) |
| `maxBreakpointWrites?` | `number` |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiCacheRequest`](../interfaces/IAiCacheRequest.md)\>
