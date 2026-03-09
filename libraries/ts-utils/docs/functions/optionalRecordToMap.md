[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / optionalRecordToMap

# Function: optionalRecordToMap()

> **optionalRecordToMap**\<`TS`, `TD`, `TK`\>(`src`, `factory`): [`Result`](../type-aliases/Result.md)\<`Map`\<`TK`, `TD`\> \| `undefined`\>

Applies a factory method to convert an optional `Record<TK, TS>` into a `Map<TK, TD>`, or `undefined`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TS` | - |
| `TD` | - |
| `TK` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `src` | `Record`\<`TK`, `TS`\> \| `undefined` | The `Record` to be converted, or undefined. |
| `factory` | [`KeyedThingFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TS`, `TD`, `TK`\> | The factory method used to convert elements. |

## Returns

[`Result`](../type-aliases/Result.md)\<`Map`\<`TK`, `TD`\> \| `undefined`\>

[Success](../classes/Success.md) with the resulting map if conversion succeeds, or [Success](../classes/Success.md) with `undefined`
if `src` is `undefined`. Returns [Failure](../classes/Failure.md) with a message if an error occurs.
