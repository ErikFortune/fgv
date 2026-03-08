[**@fgv/ts-utils**](../../../../../../README.md)

***

[@fgv/ts-utils](../../../../../../README.md) / [Collections](../../../README.md) / [Utils](../README.md) / isIterable

# Function: isIterable()

> **isIterable**\<`TE`, `TI`, `TO`\>(`value`): `value is TI`

Determines if a supplied value is an iterable object or some other type.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TE` | `unknown` |
| `TI` *extends* `Iterable`\<`TE`, `any`, `any`\> | `Iterable`\<`TE`, `any`, `any`\> |
| `TO` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `TI` \| `TO` | The value to be tested. |

## Returns

`value is TI`

`true` if the value is an iterable object, `false` otherwise.
