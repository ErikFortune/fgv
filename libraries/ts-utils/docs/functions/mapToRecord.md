[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / mapToRecord

# Function: mapToRecord()

> **mapToRecord**\<`TS`, `TD`, `TK`\>(`src`, `factory`): [`Result`](../type-aliases/Result.md)\<`Record`\<`TK`, `TD`\>\>

Applies a factory method to convert a `ReadonlyMap<TK, TS>` into a `Record<TK, TD>`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TS` | - |
| `TD` | - |
| `TK` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `src` | `ReadonlyMap`\<`TK`, `TS`\> | The `Map` object to be converted. |
| `factory` | [`KeyedThingFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TS`, `TD`, `TK`\> | The factory method used to convert elements. |

## Returns

[`Result`](../type-aliases/Result.md)\<`Record`\<`TK`, `TD`\>\>

[Success](../classes/Success.md) with the resulting `Record<TK, TD>` if conversion succeeds, or
[Failure](../classes/Failure.md) with an error message if an error occurs.
