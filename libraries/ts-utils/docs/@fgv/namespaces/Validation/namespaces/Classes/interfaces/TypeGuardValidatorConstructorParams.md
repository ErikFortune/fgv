[**@fgv/ts-utils**](../../../../../../README.md)

***

[@fgv/ts-utils](../../../../../../README.md) / [Validation](../../../README.md) / [Classes](../README.md) / TypeGuardValidatorConstructorParams

# Interface: TypeGuardValidatorConstructorParams\<T, TC\>

Parameters used to construct a [Validation.Classes.TypeGuardValidator](../classes/TypeGuardValidator.md).

## Extends

- [`ValidatorBaseConstructorParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="description"></a> `description` | `string` |
| <a id="guard"></a> `guard` | [`TypeGuardWithContext`](../../../type-aliases/TypeGuardWithContext.md)\<`T`, `TC`\> |
| <a id="options"></a> `options?` | [`ValidatorOptions`](../../../interfaces/ValidatorOptions.md)\<`TC`\> |
| <a id="traits"></a> `traits?` | `Partial`\<[`ValidatorTraits`](../../../classes/ValidatorTraits.md)\> |
