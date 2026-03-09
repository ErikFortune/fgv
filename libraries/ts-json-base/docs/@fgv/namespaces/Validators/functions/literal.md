[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [Validators](../README.md) / literal

# Function: literal()

> **literal**\<`T`\>(`value`): [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`IJsonValidatorContext`](../interfaces/IJsonValidatorContext.md)\>

Helper to create a validator for a literal value.
Accepts `IJsonValidatorContext` but ignores it.
Mirrors the behavior of `@fgv/ts-utils`.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `T` |

## Returns

[`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`IJsonValidatorContext`](../interfaces/IJsonValidatorContext.md)\>
