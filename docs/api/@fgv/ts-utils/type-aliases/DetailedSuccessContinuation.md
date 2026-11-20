[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / DetailedSuccessContinuation

# Type Alias: DetailedSuccessContinuation\<T, TD, TN\>

> **DetailedSuccessContinuation**\<`T`, `TD`, `TN`\> = (`value`, `detail?`) => [`DetailedResult`](DetailedResult.md)\<`TN`, `TD`\>

Callback to be called when a [DetailedResult](DetailedResult.md) encounters success.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |
| <a id="type-parameter-td"></a> `TD` |
| <a id="type-parameter-tn"></a> `TN` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `T` |
| `detail?` | `TD` |

## Returns

[`DetailedResult`](DetailedResult.md)\<`TN`, `TD`\>

## Remarks

A success callback can return a different result type than it receives, allowing
success results to chain through intermediate result types.
