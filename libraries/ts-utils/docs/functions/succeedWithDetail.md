[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / succeedWithDetail

# Function: succeedWithDetail()

> **succeedWithDetail**\<`T`, `TD`\>(`value`, `detail?`): [`DetailedSuccess`](../classes/DetailedSuccess.md)\<`T`, `TD`\>

Returns [DetailedSuccess\<T, TD\>](../classes/DetailedSuccess.md) with a supplied value and optional
detail.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `TD` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `T` | The value of type `<T>` to be returned. |
| `detail?` | `TD` | An optional detail of type `<TD>` to be returned. |

## Returns

[`DetailedSuccess`](../classes/DetailedSuccess.md)\<`T`, `TD`\>

A [DetailedSuccess\<T, TD\>](../classes/DetailedSuccess.md) with the supplied value
and detail, if supplied.

## Remarks

The `succeedsWithDetail` alias was added in release 5.0 for
naming consistency with [fails](fails.md), which was added to avoid conflicts
with test frameworks and libraries.
