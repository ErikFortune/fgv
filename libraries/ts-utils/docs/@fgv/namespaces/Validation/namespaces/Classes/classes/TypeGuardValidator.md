[**@fgv/ts-utils**](../../../../../../README.md)

***

[@fgv/ts-utils](../../../../../../README.md) / [Validation](../../../README.md) / [Classes](../README.md) / TypeGuardValidator

# Class: TypeGuardValidator\<T, TC\>

An in-place [Validator](../../../interfaces/Validator.md) that can be instantiated using a type guard
function.

## Extends

- [`ValidatorBase`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Constructors

### Constructor

> **new TypeGuardValidator**\<`T`, `TC`\>(`params`): `TypeGuardValidator`\<`T`, `TC`\>

Constructs a new TypeGuardValidator.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`TypeGuardValidatorConstructorParams`](../interfaces/TypeGuardValidatorConstructorParams.md)\<`T`, `TC`\> | Optional [init params](../interfaces/TypeGuardValidatorConstructorParams.md) for the new TypeGuardValidator. |

#### Returns

`TypeGuardValidator`\<`T`, `TC`\>

#### Overrides

`ValidatorBase<T, TC>.constructor`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_guard"></a> `_guard` | `readonly` | [`TypeGuardWithContext`](../../../type-aliases/TypeGuardWithContext.md)\<`T`, `TC`\> | - |
| <a id="description"></a> `description` | `readonly` | `string` | - |
| <a id="options"></a> `options` | `readonly` | [`ValidatorOptions`](../../../interfaces/ValidatorOptions.md)\<`TC`\> | [Options](../../../interfaces/ValidatorOptions.md) which apply to this validator. |
| <a id="traits"></a> `traits` | `readonly` | [`ValidatorTraits`](../../../classes/ValidatorTraits.md) | [Traits](../../../classes/ValidatorTraits.md) describing this validation. |

## Accessors

### brand

#### Get Signature

> **get** **brand**(): `string` \| `undefined`

The brand for a branded type.

##### Returns

`string` \| `undefined`

#### Inherited from

`ValidatorBase.brand`

***

### isOptional

#### Get Signature

> **get** **isOptional**(): `boolean`

Indicates whether this element is explicitly optional.

##### Returns

`boolean`

#### Inherited from

`ValidatorBase.isOptional`

## Methods

### convert()

> **convert**(`from`, `context?`): [`Result`](../../../../../../type-aliases/Result.md)\<`T`\>

Tests to see if a supplied 'unknown' value matches this validation.  In
contrast to [validate](../../../interfaces/Validator.md#validate), makes no guarantees
about the identity of the returned value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` value to be tested. |
| `context?` | `TC` | Optional validation context. |

#### Returns

[`Result`](../../../../../../type-aliases/Result.md)\<`T`\>

[Success](../../../../../../classes/Success.md) with the typed, conversion value,
or [Failure](../../../../../../classes/Failure.md) with an error message if conversion fails.

#### Inherited from

`ValidatorBase.convert`

***

### guard()

> **guard**(`from`, `context?`): `from is T`

Non-throwing type guard

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The value to be tested. |
| `context?` | `TC` | Optional validation context. |

#### Returns

`from is T`

#### Inherited from

`ValidatorBase.guard`

***

### optional()

> **optional**(): [`Validator`](../../../interfaces/Validator.md)\<`T` \| `undefined`, `TC`\>

Creates an [in-place validator](../../../interfaces/Validator.md)
which is derived from this one but which also matches `undefined`.

#### Returns

[`Validator`](../../../interfaces/Validator.md)\<`T` \| `undefined`, `TC`\>

#### Inherited from

`ValidatorBase.optional`

***

### or()

> **or**(`other`): [`Validator`](../../../interfaces/Validator.md)\<`T`, `TC`\>

Chains this validator with another of the same type, to be attempted if this
validator fails.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `other` | [`Validator`](../../../interfaces/Validator.md)\<`T`, `TC`\> | The other [Validator](../../../interfaces/Validator.md) to be attempted if this one fails. |

#### Returns

[`Validator`](../../../interfaces/Validator.md)\<`T`, `TC`\>

#### Inherited from

`ValidatorBase.or`

***

### validate()

> **validate**(`from`, `context?`): [`Result`](../../../../../../type-aliases/Result.md)\<`T`\>

Tests to see if a supplied `unknown` value matches this validation.  All
validate calls are guaranteed to return the entity passed in on Success.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` value to be tested. |
| `context?` | `TC` | Optional validation context. |

#### Returns

[`Result`](../../../../../../type-aliases/Result.md)\<`T`\>

[Success](../../../../../../classes/Success.md) with the typed, validated value,
or [Failure](../../../../../../classes/Failure.md) with an error message if validation fails.

#### Inherited from

`ValidatorBase.validate`

***

### validateOptional()

> **validateOptional**(`from`, `context?`): [`Result`](../../../../../../type-aliases/Result.md)\<`T` \| `undefined`\>

Tests to see if a supplied `unknown` value matches this
validation.  Accepts `undefined`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` value to be tested. |
| `context?` | `TC` | Optional validation context. |

#### Returns

[`Result`](../../../../../../type-aliases/Result.md)\<`T` \| `undefined`\>

[Success](../../../../../../classes/Success.md) with the typed, validated value,
or [Failure](../../../../../../classes/Failure.md) with an error message if validation fails.

#### Inherited from

`ValidatorBase.validateOptional`

***

### withBrand()

> **withBrand**\<`B`\>(`brand`): [`Validator`](../../../interfaces/Validator.md)\<[`Brand`](../../../../../../type-aliases/Brand.md)\<`T`, `B`\>, `TC`\>

The brand for a branded type.

#### Type Parameters

| Type Parameter |
| ------ |
| `B` *extends* `string` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `brand` | `B` |

#### Returns

[`Validator`](../../../interfaces/Validator.md)\<[`Brand`](../../../../../../type-aliases/Brand.md)\<`T`, `B`\>, `TC`\>

#### Inherited from

`ValidatorBase.withBrand`

***

### withConstraint()

> **withConstraint**(`constraint`, `trait?`): [`Validator`](../../../interfaces/Validator.md)\<`T`, `TC`\>

Creates an [in-place validator](../../../interfaces/Validator.md)
which is derived from this one but which applies additional constraints.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `constraint` | [`Constraint`](../../../type-aliases/Constraint.md)\<`T`\> | the constraint to be applied |
| `trait?` | [`FunctionConstraintTrait`](../../../interfaces/FunctionConstraintTrait.md) | As optional [ConstraintTrait](../../../type-aliases/ConstraintTrait.md) to be applied to the resulting [Validator](../../../interfaces/Validator.md). |

#### Returns

[`Validator`](../../../interfaces/Validator.md)\<`T`, `TC`\>

A new [Validator](../../../interfaces/Validator.md).

#### Inherited from

`ValidatorBase.withConstraint`

***

### withFormattedError()

> **withFormattedError**(`formatter`): [`Validator`](../../../interfaces/Validator.md)\<`T`, `TC`\>

Creates a new [in-place validator](../../../interfaces/Validator.md) which
is derived from this one but which returns an error message supplied
by the provided formatter if an error occurs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `formatter` | [`ValidationErrorFormatter`](../../../type-aliases/ValidationErrorFormatter.md)\<`TC`\> | The error message formatter to be applied. |

#### Returns

[`Validator`](../../../interfaces/Validator.md)\<`T`, `TC`\>

A new [Validator](../../../interfaces/Validator.md).

#### Inherited from

`ValidatorBase.withFormattedError`
