[**@fgv/ts-utils**](../../../../../../README.md)

***

[@fgv/ts-utils](../../../../../../README.md) / [Validation](../../../README.md) / [Base](../README.md) / GenericValidator

# Class: GenericValidator\<T, TC\>

Generic base implementation for an in-place [Validator](../../../interfaces/Validator.md).

## Extended by

- [`BooleanValidator`](../../Classes/classes/BooleanValidator.md)
- [`NumberValidator`](../../Classes/classes/NumberValidator.md)
- [`StringValidator`](../../Classes/classes/StringValidator.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Implements

- [`Validator`](../../../interfaces/Validator.md)\<`T`, `TC`\>

## Constructors

### Constructor

> **new GenericValidator**\<`T`, `TC`\>(`params`): `GenericValidator`\<`T`, `TC`\>

Constructs a new GenericValidator\<T\>.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | `Partial`\<[`GenericValidatorConstructorParams`](../interfaces/GenericValidatorConstructorParams.md)\<`T`, `TC`\>\> | The [constructor params](../interfaces/GenericValidatorConstructorParams.md) used to configure validation. |

#### Returns

`GenericValidator`\<`T`, `TC`\>

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

#### Implementation of

[`Validator`](../../../interfaces/Validator.md).[`brand`](../../../interfaces/Validator.md#brand)

***

### isOptional

#### Get Signature

> **get** **isOptional**(): `boolean`

Indicates whether this element is explicitly optional.

##### Returns

`boolean`

Indicates whether this element is explicitly optional.

#### Implementation of

[`Validator`](../../../interfaces/Validator.md).[`isOptional`](../../../interfaces/Validator.md#isoptional)

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

#### Implementation of

[`Validator`](../../../interfaces/Validator.md).[`convert`](../../../interfaces/Validator.md#convert)

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

#### Implementation of

[`Validator`](../../../interfaces/Validator.md).[`guard`](../../../interfaces/Validator.md#guard)

***

### optional()

> **optional**(): [`Validator`](../../../interfaces/Validator.md)\<`T` \| `undefined`, `TC`\>

Creates an [in-place validator](../../../interfaces/Validator.md)
which is derived from this one but which also matches `undefined`.

#### Returns

[`Validator`](../../../interfaces/Validator.md)\<`T` \| `undefined`, `TC`\>

#### Implementation of

[`Validator`](../../../interfaces/Validator.md).[`optional`](../../../interfaces/Validator.md#optional)

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

#### Implementation of

[`Validator`](../../../interfaces/Validator.md).[`or`](../../../interfaces/Validator.md#or)

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

#### Implementation of

[`Validator`](../../../interfaces/Validator.md).[`validate`](../../../interfaces/Validator.md#validate)

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

#### Implementation of

[`Validator`](../../../interfaces/Validator.md).[`validateOptional`](../../../interfaces/Validator.md#validateoptional)

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

#### Implementation of

[`Validator`](../../../interfaces/Validator.md).[`withBrand`](../../../interfaces/Validator.md#withbrand)

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

#### Implementation of

[`Validator`](../../../interfaces/Validator.md).[`withConstraint`](../../../interfaces/Validator.md#withconstraint)

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

#### Implementation of

[`Validator`](../../../interfaces/Validator.md).[`withFormattedError`](../../../interfaces/Validator.md#withformattederror)
