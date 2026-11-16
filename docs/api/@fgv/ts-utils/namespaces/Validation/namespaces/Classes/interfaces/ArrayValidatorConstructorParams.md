[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-utils](../../../../../README.md) / [Validation](../../../README.md) / [Classes](../README.md) / ArrayValidatorConstructorParams

# Interface: ArrayValidatorConstructorParams\<T, TC\>

Parameters used to construct a [ArrayValidator](../classes/ArrayValidator.md).

## Extends

- [`ValidatorBaseConstructorParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`[], `TC`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` | - |
| <a id="type-parameter-tc"></a> `TC` | `unknown` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-options"></a> `options?` | [`ValidatorOptions`](../../../interfaces/ValidatorOptions.md)\<`TC`\> |
| <a id="property-traits"></a> `traits?` | `Partial`\<[`ValidatorTraits`](../../../classes/ValidatorTraits.md)\> |
| <a id="property-validateelement"></a> `validateElement` | [`Validator`](../../../interfaces/Validator.md)\<`T`, `TC`\> |
