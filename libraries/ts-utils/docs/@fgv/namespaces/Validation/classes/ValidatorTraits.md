[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Validation](../README.md) / ValidatorTraits

# Class: ValidatorTraits

Generic implementation of [ValidatorTraitValues](../interfaces/ValidatorTraitValues.md).

## Implements

- [`ValidatorTraitValues`](../interfaces/ValidatorTraitValues.md)

## Constructors

### Constructor

> **new ValidatorTraits**(`init?`, `base?`): `ValidatorTraits`

Constructs a new ValidatorTraits optionally
initialized with the supplied base and initial values.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `init?` | `Partial`\<[`ValidatorTraitValues`](../interfaces/ValidatorTraitValues.md)\> | Partial initial values to be set in the resulting [Validator](../interfaces/Validator.md). |
| `base?` | [`ValidatorTraitValues`](../interfaces/ValidatorTraitValues.md) | Base values to be used when no initial values are present. |

#### Returns

`ValidatorTraits`

#### Remarks

Initial values take priority over base values, which fall back to the global default values.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="brand"></a> `brand?` | `readonly` | `string` | If present, indicates that the result will be branded with the corresponding brand. |
| <a id="constraints"></a> `constraints` | `readonly` | [`FunctionConstraintTrait`](../interfaces/FunctionConstraintTrait.md)[] | Zero or more additional [ConstraintTrait](../type-aliases/ConstraintTrait.md)s describing additional constraints applied by this [Validator](../interfaces/Validator.md). |
| <a id="isoptional"></a> `isOptional` | `readonly` | `boolean` | Indicates whether the validator accepts `undefined` as a valid value. |
