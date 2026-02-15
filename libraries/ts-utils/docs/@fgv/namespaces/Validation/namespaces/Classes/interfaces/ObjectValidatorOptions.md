[**@fgv/ts-utils**](../../../../../../README.md)

***

[@fgv/ts-utils](../../../../../../README.md) / [Validation](../../../README.md) / [Classes](../README.md) / ObjectValidatorOptions

# Interface: ObjectValidatorOptions\<T, TC\>

Options for an [ObjectValidator](../classes/ObjectValidator.md).

## Extends

- [`ValidatorOptions`](../../../interfaces/ValidatorOptions.md)\<`TC`\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `TC` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="defaultcontext"></a> `defaultContext?` | `TC` | - |
| <a id="optionalfields"></a> `optionalFields?` | keyof `T`[] | If present, lists optional fields. Missing non-optional fields cause an error. |
| <a id="strict"></a> `strict?` | `boolean` | If true, unrecognized fields yield an error. If false or undefined (default), unrecognized fields are ignored. |
