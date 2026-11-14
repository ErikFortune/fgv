[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-utils](../../../../../README.md) / [Validation](../../../README.md) / [Classes](../README.md) / TypeGuardValidatorConstructorParams

# Interface: TypeGuardValidatorConstructorParams\<T, TC\>

Parameters used to construct a [Validation.Classes.TypeGuardValidator](../classes/TypeGuardValidator.md).

## Extends

- [`ValidatorBaseConstructorParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` | - |
| <a id="type-parameter-tc"></a> `TC` | `unknown` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-description"></a> `description` | `string` |
| <a id="property-guard"></a> `guard` | [`TypeGuardWithContext`](../../../type-aliases/TypeGuardWithContext.md)\<`T`, `TC`\> |
| <a id="property-options"></a> `options?` | [`ValidatorOptions`](../../../interfaces/ValidatorOptions.md)\<`TC`\> |
| <a id="property-traits"></a> `traits?` | `Partial`\<[`ValidatorTraits`](../../../classes/ValidatorTraits.md)\> |
