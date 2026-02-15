[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / DetailedSuccessContinuation

# Type Alias: DetailedSuccessContinuation()\<T, TD, TN\>

> **DetailedSuccessContinuation**\<`T`, `TD`, `TN`\> = (`value`, `detail?`) => [`DetailedResult`](DetailedResult.md)\<`TN`, `TD`\>

Callback to be called when a [DetailedResult](DetailedResult.md) encounters success.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `TD` |
| `TN` |

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
