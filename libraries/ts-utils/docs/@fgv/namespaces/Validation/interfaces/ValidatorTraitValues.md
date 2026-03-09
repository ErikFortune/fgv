[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Validation](../README.md) / ValidatorTraitValues

# Interface: ValidatorTraitValues

Interface describing the supported validator traits.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="brand"></a> `brand?` | `readonly` | `string` | If present, indicates that the result will be branded with the corresponding brand. |
| <a id="constraints"></a> `constraints` | `readonly` | [`FunctionConstraintTrait`](FunctionConstraintTrait.md)[] | Zero or more additional [ConstraintTrait](../type-aliases/ConstraintTrait.md)s describing additional constraints applied by this [Validator](Validator.md). |
| <a id="isoptional"></a> `isOptional` | `readonly` | `boolean` | Indicates whether the validator accepts `undefined` as a valid value. |
