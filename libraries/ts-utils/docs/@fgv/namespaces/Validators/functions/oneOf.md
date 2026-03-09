[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Validators](../README.md) / oneOf

# Function: oneOf()

> **oneOf**\<`T`, `TC`\>(`validators`, `params?`): [`OneOfValidator`](../../Validation/namespaces/Classes/classes/OneOfValidator.md)\<`T`, `TC`\>

Helper function to create a [Validator](../../Validation/interfaces/Validator.md) which validates one
of several possible validated values.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `validators` | [`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\>[] | the [validators](../../Validation/interfaces/Validator.md) to be considered. |
| `params?` | `Omit`\<[`OneOfValidatorConstructorParams`](../../Validation/namespaces/Classes/interfaces/OneOfValidatorConstructorParams.md)\<`T`, `TC`\>, `"validators"`\> | Optional [params](../../Validation/namespaces/Classes/interfaces/OneOfValidatorConstructorParams.md) used to construct the validator. |

## Returns

[`OneOfValidator`](../../Validation/namespaces/Classes/classes/OneOfValidator.md)\<`T`, `TC`\>

A new [Validator](../../Validation/interfaces/Validator.md) which validates values that match any of
the supplied validators.
