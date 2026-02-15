[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Validators](../README.md) / recordOf

# Function: recordOf()

> **recordOf**\<`T`, `TC`, `TK`\>(`validator`, `options?`): [`Validator`](../../Validation/interfaces/Validator.md)\<`Record`\<`TK`, `T`\>, `TC`\>

A helper function to create a [Validator](../../Validation/interfaces/Validator.md) which validates the `string`-keyed properties
using a supplied [Validator\<T, TC\>](../../Validation/interfaces/Validator.md) to produce a `Record<TK, T>`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |
| `TK` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `validator` | [`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\> | [Validator](../../Validation/interfaces/Validator.md) used for each item in the source object. |
| `options?` | [`IRecordOfValidatorOptions`](../interfaces/IRecordOfValidatorOptions.md)\<`TK`, `TC`\> | Optional [IRecordOfValidatorOptions\<TK, TC\>](../interfaces/IRecordOfValidatorOptions.md) which supplies a key validator and/or error-handling options. |

## Returns

[`Validator`](../../Validation/interfaces/Validator.md)\<`Record`\<`TK`, `T`\>, `TC`\>

A [Validator](../../Validation/interfaces/Validator.md) which validates `Record<TK, T>`.

## Remarks

If present, the supplied [options](../interfaces/IRecordOfValidatorOptions.md) can provide a strongly-typed
validator for keys and/or control the handling of elements that fail validation.
