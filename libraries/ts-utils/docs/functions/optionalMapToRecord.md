[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / optionalMapToRecord

# Function: optionalMapToRecord()

> **optionalMapToRecord**\<`TS`, `TD`, `TK`\>(`src`, `factory`): [`Result`](../type-aliases/Result.md)\<`Record`\<`TK`, `TD`\> \| `undefined`\>

Applies a factory method to convert an optional `ReadonlyMap<string, TS>` into a `Record<string, TD>` or `undefined`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TS` | - |
| `TD` | - |
| `TK` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `src` | `ReadonlyMap`\<`TK`, `TS`\> \| `undefined` | The `Map` object to be converted, or `undefined`. |
| `factory` | [`KeyedThingFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TS`, `TD`, `TK`\> | The factory method used to convert elements. |

## Returns

[`Result`](../type-aliases/Result.md)\<`Record`\<`TK`, `TD`\> \| `undefined`\>

[Success](../classes/Success.md) with the resulting record if conversion succeeds, or [Success](../classes/Success.md) with `undefined` if
`src` is `undefined`. Returns [Failure](../classes/Failure.md) with a message if an error occurs.
