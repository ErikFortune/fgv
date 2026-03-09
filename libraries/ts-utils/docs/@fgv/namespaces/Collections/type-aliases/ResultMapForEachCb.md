[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / ResultMapForEachCb

# Type Alias: ResultMapForEachCb()\<TK, TE\>

> **ResultMapForEachCb**\<`TK`, `TE`\> = (`value`, `key`, `map`, `thisArg?`) => `void`

Callback for [ResultMap](../classes/ResultMap.md) `forEach` method.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TK` *extends* `string` | `string` |
| `TE` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TE` |
| `key` | `TK` |
| `map` | [`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md)\<`TK`, `TE`\> |
| `thisArg?` | `unknown` |

## Returns

`void`
