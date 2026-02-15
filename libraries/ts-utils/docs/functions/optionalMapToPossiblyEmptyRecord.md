[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / optionalMapToPossiblyEmptyRecord

# Function: optionalMapToPossiblyEmptyRecord()

> **optionalMapToPossiblyEmptyRecord**\<`TS`, `TD`, `TK`\>(`src`, `factory`): [`Result`](../type-aliases/Result.md)\<`Record`\<`TK`, `TD`\>\>

Applies a factory method to convert an optional `ReadonlyMap<string, TS>` into a `Record<string, TD>`

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TS` | - |
| `TD` | - |
| `TK` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `src` | `ReadonlyMap`\<`TK`, `TS`\> \| `undefined` | The `ReadonlyMap` object to be converted, or `undefined`. |
| `factory` | [`KeyedThingFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TS`, `TD`, `TK`\> | The factory method used to convert elements. |

## Returns

[`Result`](../type-aliases/Result.md)\<`Record`\<`TK`, `TD`\>\>

[Success](../classes/Success.md) with the resulting record (empty if `src` is `undefined`) if conversion succeeds.
Returns [Failure](../classes/Failure.md) with a message if an error occurs.
