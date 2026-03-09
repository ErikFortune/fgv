[**@fgv/ts-utils**](../../../../../../README.md)

***

[@fgv/ts-utils](../../../../../../README.md) / [Validation](../../../README.md) / [Classes](../README.md) / ObjectValidatorConstructorParams

# Interface: ObjectValidatorConstructorParams\<T, TC\>

Options for the [ObjectValidator](../classes/ObjectValidator.md) constructor.

## Extends

- [`ValidatorBaseConstructorParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `TC` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="fields"></a> `fields` | [`FieldValidators`](../type-aliases/FieldValidators.md)\<`T`\> | A [FieldValidators](../type-aliases/FieldValidators.md) object specifying a [Validator](../../../interfaces/Validator.md) for each of the expected properties of a result object. |
| <a id="options"></a> `options?` | [`ObjectValidatorOptions`](ObjectValidatorOptions.md)\<`T`, `TC`\> | Optional additional [ValidatorOptions](ObjectValidatorOptions.md) to configure validation. |
| <a id="traits"></a> `traits?` | `Partial`\<[`ValidatorTraits`](../../../classes/ValidatorTraits.md)\> | - |
