[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / recordToMap

# Function: recordToMap()

> **recordToMap**\<`TS`, `TD`, `TK`\>(`src`, `factory`): [`Result`](../type-aliases/Result.md)\<`Map`\<`TK`, `TD`\>\>

Applies a factory method to convert a `Record<TK, TS>` into a `Map<TK, TD>`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TS` | - |
| `TD` | - |
| `TK` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `src` | `Record`\<`TK`, `TS`\> | The `Record` to be converted. |
| `factory` | [`KeyedThingFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TS`, `TD`, `TK`\> | The factory method used to convert elements. |

## Returns

[`Result`](../type-aliases/Result.md)\<`Map`\<`TK`, `TD`\>\>

[Success](../classes/Success.md) with the resulting map on success, or [Failure](../classes/Failure.md) with a
message if an error occurs.
