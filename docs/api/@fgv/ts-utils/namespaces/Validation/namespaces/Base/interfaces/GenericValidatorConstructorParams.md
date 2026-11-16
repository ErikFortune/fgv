[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-utils](../../../../../README.md) / [Validation](../../../README.md) / [Base](../README.md) / GenericValidatorConstructorParams

# Interface: GenericValidatorConstructorParams\<T, TC\>

Options used to initialize a [GenericValidator](../classes/GenericValidator.md).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |
| <a id="type-parameter-tc"></a> `TC` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-options"></a> `options?` | [`ValidatorOptions`](../../../interfaces/ValidatorOptions.md)\<`TC`\> |
| <a id="property-traits"></a> `traits?` | `Partial`\<[`ValidatorTraits`](../../../classes/ValidatorTraits.md)\> |
| <a id="property-validator"></a> `validator?` | [`ValidatorFunc`](../../../type-aliases/ValidatorFunc.md)\<`T`, `TC`\> |
