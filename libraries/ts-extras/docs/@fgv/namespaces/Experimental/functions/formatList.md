[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [Experimental](../README.md) / formatList

# Function: formatList()

> **formatList**\<`T`\>(`format`, `items`, `itemFormatter`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

**`Beta`**

Formats a list of items using the supplied template and formatter, one result
per output line.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `format` | `string` | A mustache template used to format each item. |
| `items` | `T`[] | The items to be formatted. |
| `itemFormatter` | [`Formatter`](../type-aliases/Formatter.md)\<`T`\> | The [Formatter\<T\>](../type-aliases/Formatter.md) used to format each item. |

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

The resulting string.
