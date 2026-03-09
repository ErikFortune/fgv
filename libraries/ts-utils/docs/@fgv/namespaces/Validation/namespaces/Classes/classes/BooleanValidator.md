[**@fgv/ts-utils**](../../../../../../README.md)

***

[@fgv/ts-utils](../../../../../../README.md) / [Validation](../../../README.md) / [Classes](../README.md) / BooleanValidator

# Class: BooleanValidator\<TC\>

An in-place [Validator](../../../interfaces/Validator.md) for `boolean` values.

## Extends

- [`GenericValidator`](../../Base/classes/GenericValidator.md)\<`boolean`, `TC`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TC` | `unknown` |

## Constructors

### Constructor

> **new BooleanValidator**\<`TC`\>(`params?`): `BooleanValidator`\<`TC`\>

Constructs a new BooleanValidator.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`BooleanValidatorConstructorParams`](../type-aliases/BooleanValidatorConstructorParams.md)\<`TC`\> | Optional [init params](../type-aliases/BooleanValidatorConstructorParams.md) for the new BooleanValidator. |

#### Returns

`BooleanValidator`\<`TC`\>

#### Overrides

[`GenericValidator`](../../Base/classes/GenericValidator.md).[`constructor`](../../Base/classes/GenericValidator.md#constructor)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="traits"></a> `traits` | `readonly` | [`ValidatorTraits`](../../../classes/ValidatorTraits.md) | [Traits](../../../classes/ValidatorTraits.md) describing this validation. |

## Accessors

### brand

#### Get Signature

> **get** **brand**(): `string` \| `undefined`

The brand for a branded type.

##### Returns

`string` \| `undefined`

The brand for a branded type.

#### Inherited from

[`GenericValidator`](../../Base/classes/GenericValidator.md).[`brand`](../../Base/classes/GenericValidator.md#brand)

***

### isOptional

#### Get Signature

> **get** **isOptional**(): `boolean`

Indicates whether this element is explicitly optional.

##### Returns

`boolean`

Indicates whether this element is explicitly optional.

#### Inherited from

[`GenericValidator`](../../Base/classes/GenericValidator.md).[`isOptional`](../../Base/classes/GenericValidator.md#isoptional)

## Methods

### convert()

> **convert**(`from`, `context?`): [`Result`](../../../../../../type-aliases/Result.md)\<`boolean`\>

Tests to see if a supplied 'unknown' value matches this validation.  In
contrast to [validate](../../../interfaces/Validator.md#validate), makes no guarantees
about the identity of the returned value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` value to be tested. |
| `context?` | `TC` | Optional validation context. |

#### Returns

[`Result`](../../../../../../type-aliases/Result.md)\<`boolean`\>

[Success](../../../../../../classes/Success.md) with the typed, conversion value,
or [Failure](../../../../../../classes/Failure.md) with an error message if conversion fails.

#### Inherited from

[`GenericValidator`](../../Base/classes/GenericValidator.md).[`convert`](../../Base/classes/GenericValidator.md#convert)

***

### guard()

> **guard**(`from`, `context?`): `from is boolean`

Non-throwing type guard

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The value to be tested. |
| `context?` | `TC` | Optional validation context. |

#### Returns

`from is boolean`

#### Inherited from

[`GenericValidator`](../../Base/classes/GenericValidator.md).[`guard`](../../Base/classes/GenericValidator.md#guard)

***

### optional()

> **optional**(): [`Validator`](../../../interfaces/Validator.md)\<`boolean` \| `undefined`, `TC`\>

Creates an [in-place validator](../../../interfaces/Validator.md)
which is derived from this one but which also matches `undefined`.

#### Returns

[`Validator`](../../../interfaces/Validator.md)\<`boolean` \| `undefined`, `TC`\>

#### Inherited from

[`GenericValidator`](../../Base/classes/GenericValidator.md).[`optional`](../../Base/classes/GenericValidator.md#optional)

***

### or()

> **or**(`other`): [`Validator`](../../../interfaces/Validator.md)\<`boolean`, `TC`\>

Chains this validator with another of the same type, to be attempted if this
validator fails.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `other` | [`Validator`](../../../interfaces/Validator.md)\<`boolean`, `TC`\> | The other [Validator](../../../interfaces/Validator.md) to be attempted if this one fails. |

#### Returns

[`Validator`](../../../interfaces/Validator.md)\<`boolean`, `TC`\>

#### Inherited from

[`GenericValidator`](../../Base/classes/GenericValidator.md).[`or`](../../Base/classes/GenericValidator.md#or)

***

### validate()

> **validate**(`from`, `context?`): [`Result`](../../../../../../type-aliases/Result.md)\<`boolean`\>

Tests to see if a supplied `unknown` value matches this validation.  All
validate calls are guaranteed to return the entity passed in on Success.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` value to be tested. |
| `context?` | `TC` | Optional validation context. |

#### Returns

[`Result`](../../../../../../type-aliases/Result.md)\<`boolean`\>

[Success](../../../../../../classes/Success.md) with the typed, validated value,
or [Failure](../../../../../../classes/Failure.md) with an error message if validation fails.

#### Inherited from

[`GenericValidator`](../../Base/classes/GenericValidator.md).[`validate`](../../Base/classes/GenericValidator.md#validate)

***

### validateOptional()

> **validateOptional**(`from`, `context?`): [`Result`](../../../../../../type-aliases/Result.md)\<`boolean` \| `undefined`\>

Tests to see if a supplied `unknown` value matches this
validation.  Accepts `undefined`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` value to be tested. |
| `context?` | `TC` | Optional validation context. |

#### Returns

[`Result`](../../../../../../type-aliases/Result.md)\<`boolean` \| `undefined`\>

[Success](../../../../../../classes/Success.md) with the typed, validated value,
or [Failure](../../../../../../classes/Failure.md) with an error message if validation fails.

#### Inherited from

[`GenericValidator`](../../Base/classes/GenericValidator.md).[`validateOptional`](../../Base/classes/GenericValidator.md#validateoptional)

***

### withBrand()

> **withBrand**\<`B`\>(`brand`): [`Validator`](../../../interfaces/Validator.md)\<[`Brand`](../../../../../../type-aliases/Brand.md)\<`boolean`, `B`\>, `TC`\>

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

[`Validator`](../../../interfaces/Validator.md)\<[`Brand`](../../../../../../type-aliases/Brand.md)\<`boolean`, `B`\>, `TC`\>

#### Inherited from

[`GenericValidator`](../../Base/classes/GenericValidator.md).[`withBrand`](../../Base/classes/GenericValidator.md#withbrand)

***

### withConstraint()

> **withConstraint**(`constraint`, `trait?`): [`Validator`](../../../interfaces/Validator.md)\<`boolean`, `TC`\>

Creates an [in-place validator](../../../interfaces/Validator.md)
which is derived from this one but which applies additional constraints.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `constraint` | [`Constraint`](../../../type-aliases/Constraint.md)\<`boolean`\> | the constraint to be applied |
| `trait?` | [`FunctionConstraintTrait`](../../../interfaces/FunctionConstraintTrait.md) | As optional [ConstraintTrait](../../../type-aliases/ConstraintTrait.md) to be applied to the resulting [Validator](../../../interfaces/Validator.md). |

#### Returns

[`Validator`](../../../interfaces/Validator.md)\<`boolean`, `TC`\>

A new [Validator](../../../interfaces/Validator.md).

#### Inherited from

[`GenericValidator`](../../Base/classes/GenericValidator.md).[`withConstraint`](../../Base/classes/GenericValidator.md#withconstraint)

***

### withFormattedError()

> **withFormattedError**(`formatter`): [`Validator`](../../../interfaces/Validator.md)\<`boolean`, `TC`\>

Creates a new [in-place validator](../../../interfaces/Validator.md) which
is derived from this one but which returns an error message supplied
by the provided formatter if an error occurs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `formatter` | [`ValidationErrorFormatter`](../../../type-aliases/ValidationErrorFormatter.md)\<`TC`\> | The error message formatter to be applied. |

#### Returns

[`Validator`](../../../interfaces/Validator.md)\<`boolean`, `TC`\>

A new [Validator](../../../interfaces/Validator.md).

#### Inherited from

[`GenericValidator`](../../Base/classes/GenericValidator.md).[`withFormattedError`](../../Base/classes/GenericValidator.md#withformattederror)

***

### validateBoolean()

> `static` **validateBoolean**(`from`): `boolean` \| [`Failure`](../../../../../../classes/Failure.md)\<`boolean`\>

Static method which validates that a supplied `unknown` value is a `boolean`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` value to be tested. |

#### Returns

`boolean` \| [`Failure`](../../../../../../classes/Failure.md)\<`boolean`\>

Returns `true` if `from` is a `boolean`, or [Failure](../../../../../../classes/Failure.md) with an error
message if not.
