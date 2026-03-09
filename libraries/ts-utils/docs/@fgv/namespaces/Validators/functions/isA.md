[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Validators](../README.md) / isA

# Function: isA()

> **isA**\<`T`, `TC`\>(`description`, `guard`, `params?`): [`TypeGuardValidator`](../../Validation/namespaces/Classes/classes/TypeGuardValidator.md)\<`T`, `TC`\>

Helper function to create a [TypeGuardValidator](../../Validation/namespaces/Classes/classes/TypeGuardValidator.md) which
validates a value or object in place.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `description` | `string` | a description of the thing to be validated for use in error messages |
| `guard` | [`TypeGuardWithContext`](../../Validation/type-aliases/TypeGuardWithContext.md)\<`T`, `TC`\> | a [Validation.TypeGuardWithContext](../../Validation/type-aliases/TypeGuardWithContext.md) which performs the validation. |
| `params?` | `Omit`\<[`TypeGuardValidatorConstructorParams`](../../Validation/namespaces/Classes/interfaces/TypeGuardValidatorConstructorParams.md)\<`T`, `TC`\>, `"description"` \| `"guard"`\> | - |

## Returns

[`TypeGuardValidator`](../../Validation/namespaces/Classes/classes/TypeGuardValidator.md)\<`T`, `TC`\>

A new [TypeGuardValidator](../../Validation/namespaces/Classes/classes/TypeGuardValidator.md) which validates
the values using the supplied type guard.
