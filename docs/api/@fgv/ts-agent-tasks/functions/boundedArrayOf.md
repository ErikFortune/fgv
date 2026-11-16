[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / boundedArrayOf

# Function: boundedArrayOf()

> **boundedArrayOf**\<`T`\>(`item`, `maxItems`, `description`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `T`[]\>

Builds a converter for a bounded readonly array.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `item` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\> |
| `maxItems` | `number` |
| `description` | `string` |

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `T`[]\>

## Remarks

The length is checked **before** any element is converted. Checking it afterwards would
bound the result but not the work: an oversized array would be validated element by element
in full, and only then refused.
