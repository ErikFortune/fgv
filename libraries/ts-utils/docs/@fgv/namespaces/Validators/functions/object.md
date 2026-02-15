[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Validators](../README.md) / object

# Function: object()

> **object**\<`T`, `TC`\>(`fields`, `params?`): [`ObjectValidator`](../../Validation/namespaces/Classes/classes/ObjectValidator.md)\<`T`, `TC`\>

Helper function to create a [ObjectValidator](../../Validation/namespaces/Classes/classes/ObjectValidator.md) which validates
an object in place.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fields` | [`FieldValidators`](../../Validation/namespaces/Classes/type-aliases/FieldValidators.md)\<`T`, `TC`\> | A [field validator definition](../../Validation/namespaces/Classes/type-aliases/FieldValidators.md) describing the validations to be applied. |
| `params?` | `Omit`\<[`ObjectValidatorConstructorParams`](../../Validation/namespaces/Classes/interfaces/ObjectValidatorConstructorParams.md)\<`T`, `TC`\>, `"fields"`\> | Optional [parameters](../../Validation/namespaces/Classes/interfaces/ObjectValidatorConstructorParams.md) to refine the behavior of the resulting [validator](../../Validation/interfaces/Validator.md). |

## Returns

[`ObjectValidator`](../../Validation/namespaces/Classes/classes/ObjectValidator.md)\<`T`, `TC`\>

A new [Validator](../../Validation/interfaces/Validator.md) which validates the desired
object in place.
