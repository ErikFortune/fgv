[**@fgv/ts-utils**](../../../../../../README.md)

***

[@fgv/ts-utils](../../../../../../README.md) / [Validation](../../../README.md) / [Classes](../README.md) / OneOfValidatorConstructorParams

# Interface: OneOfValidatorConstructorParams\<T, TC\>

Parameters used to construct a [OneOfValidator](../classes/OneOfValidator.md).

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
| <a id="options"></a> `options?` | [`ValidatorOptions`](../../../interfaces/ValidatorOptions.md)\<`TC`\> |
| <a id="traits"></a> `traits?` | `Partial`\<[`ValidatorTraits`](../../../classes/ValidatorTraits.md)\> |
| <a id="validators"></a> `validators` | [`Validator`](../../../interfaces/Validator.md)\<`T`, `TC`\>[] |
