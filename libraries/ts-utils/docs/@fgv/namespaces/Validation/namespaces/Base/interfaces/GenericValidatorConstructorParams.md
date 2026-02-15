[**@fgv/ts-utils**](../../../../../../README.md)

***

[@fgv/ts-utils](../../../../../../README.md) / [Validation](../../../README.md) / [Base](../README.md) / GenericValidatorConstructorParams

# Interface: GenericValidatorConstructorParams\<T, TC\>

Options used to initialize a [GenericValidator](../classes/GenericValidator.md).

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `TC` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="options"></a> `options?` | [`ValidatorOptions`](../../../interfaces/ValidatorOptions.md)\<`TC`\> |
| <a id="traits"></a> `traits?` | `Partial`\<[`ValidatorTraits`](../../../classes/ValidatorTraits.md)\> |
| <a id="validator"></a> `validator?` | [`ValidatorFunc`](../../../type-aliases/ValidatorFunc.md)\<`T`, `TC`\> |
