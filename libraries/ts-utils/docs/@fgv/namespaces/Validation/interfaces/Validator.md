[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Validation](../README.md) / Validator

# Interface: Validator\<T, TC\>

In-place validation that a supplied unknown matches some
required characteristics (type, values, etc).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="brand"></a> `brand` | `readonly` | `string` \| `undefined` | The brand for a branded type. |
| <a id="isoptional"></a> `isOptional` | `readonly` | `boolean` | Indicates whether this element is explicitly optional. |
| <a id="traits"></a> `traits` | `readonly` | [`ValidatorTraits`](../classes/ValidatorTraits.md) | [Traits](../classes/ValidatorTraits.md) describing this validation. |

## Methods

### convert()

> **convert**(`from`, `context?`): [`Result`](../../../../type-aliases/Result.md)\<`T`\>

Tests to see if a supplied 'unknown' value matches this validation.  In
contrast to [validate](#validate), makes no guarantees
about the identity of the returned value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` value to be tested. |
| `context?` | `TC` | Optional validation context. |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`T`\>

[Success](../../../../classes/Success.md) with the typed, conversion value,
or [Failure](../../../../classes/Failure.md) with an error message if conversion fails.

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

***

### optional()

> **optional**(): `Validator`\<`T` \| `undefined`, `TC`\>

Creates an in-place validator
which is derived from this one but which also matches `undefined`.

#### Returns

`Validator`\<`T` \| `undefined`, `TC`\>

***

### or()

> **or**(`other`): `Validator`\<`T`, `TC`\>

Chains this validator with another of the same type, to be attempted if this
validator fails.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `other` | `Validator`\<`T`, `TC`\> | The other Validator to be attempted if this one fails. |

#### Returns

`Validator`\<`T`, `TC`\>

***

### validate()

> **validate**(`from`, `context?`): [`Result`](../../../../type-aliases/Result.md)\<`T`\>

Tests to see if a supplied `unknown` value matches this validation.  All
validate calls are guaranteed to return the entity passed in on Success.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` value to be tested. |
| `context?` | `TC` | Optional validation context. |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`T`\>

[Success](../../../../classes/Success.md) with the typed, validated value,
or [Failure](../../../../classes/Failure.md) with an error message if validation fails.

***

### validateOptional()

> **validateOptional**(`from`, `context?`): [`Result`](../../../../type-aliases/Result.md)\<`T` \| `undefined`\>

Tests to see if a supplied `unknown` value matches this
validation.  Accepts `undefined`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` value to be tested. |
| `context?` | `TC` | Optional validation context. |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`T` \| `undefined`\>

[Success](../../../../classes/Success.md) with the typed, validated value,
or [Failure](../../../../classes/Failure.md) with an error message if validation fails.

***

### withBrand()

> **withBrand**\<`B`\>(`brand`): `Validator`\<[`Brand`](../../../../type-aliases/Brand.md)\<`T`, `B`\>, `TC`\>

Creates a new in-place validator which
is derived from this one but which matches a branded result.

#### Type Parameters

| Type Parameter |
| ------ |
| `B` *extends* `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `brand` | `B` | The brand to be applied. |

#### Returns

`Validator`\<[`Brand`](../../../../type-aliases/Brand.md)\<`T`, `B`\>, `TC`\>

***

### withConstraint()

> **withConstraint**(`constraint`, `trait?`): `Validator`\<`T`, `TC`\>

Creates an in-place validator
which is derived from this one but which applies additional constraints.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `constraint` | [`Constraint`](../type-aliases/Constraint.md)\<`T`\> | the constraint to be applied |
| `trait?` | [`FunctionConstraintTrait`](FunctionConstraintTrait.md) | As optional [ConstraintTrait](../type-aliases/ConstraintTrait.md) to be applied to the resulting Validator. |

#### Returns

`Validator`\<`T`, `TC`\>

A new Validator.

***

### withFormattedError()

> **withFormattedError**(`formatter`): `Validator`\<`T`, `TC`\>

Creates a new in-place validator which
is derived from this one but which returns an error message supplied
by the provided formatter if an error occurs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `formatter` | [`ValidationErrorFormatter`](../type-aliases/ValidationErrorFormatter.md)\<`TC`\> | The error message formatter to be applied. |

#### Returns

`Validator`\<`T`, `TC`\>

A new Validator.
