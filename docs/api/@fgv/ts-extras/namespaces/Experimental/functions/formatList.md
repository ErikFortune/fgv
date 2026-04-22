[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [Experimental](../README.md) / formatList

# Function: formatList()

> **formatList**\<`T`\>(`format`, `items`, `itemFormatter`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

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

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

The resulting string.
