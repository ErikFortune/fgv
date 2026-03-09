[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / optionalRecordToPossiblyEmptyMap

# Function: optionalRecordToPossiblyEmptyMap()

> **optionalRecordToPossiblyEmptyMap**\<`TS`, `TD`, `TK`\>(`src`, `factory`): [`Result`](../type-aliases/Result.md)\<`Map`\<`TK`, `TD`\>\>

Applies a factory method to convert an optional `Record<TK, TS>` into a `Map<TK, TD>`

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TS` | - |
| `TD` | - |
| `TK` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `src` | `Record`\<`TK`, `TS`\> \| `undefined` | The `Record` to be converted, or `undefined`. |
| `factory` | [`KeyedThingFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TS`, `TD`, `TK`\> | The factory method used to convert elements. |

## Returns

[`Result`](../type-aliases/Result.md)\<`Map`\<`TK`, `TD`\>\>

[Success](../classes/Success.md) with the resulting map (empty if `src` is `undefined`) if conversion succeeds.
Returns [Failure](../classes/Failure.md) with a message if an error occurs.
