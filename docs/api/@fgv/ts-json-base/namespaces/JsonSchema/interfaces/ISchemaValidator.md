[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / ISchemaValidator

# Interface: ISchemaValidator\<T\>

A typed JSON Schema node for the LLM-tool subset. Every value returned by the
schema factories implements this interface — it IS a `Validator<T>` and also
carries a `toJson()` method for wire-format emission.

## Remarks

The `__staticType` property is a phantom: it exists only in the type system to carry
the derived static type `T` and is never assigned at runtime (declared optional so
factory return values need not populate it). `Static<S>` reads this slot to recover
`T` from a schema value without requiring a user-supplied type assertion. A plain
optional property is used rather than a module-private `unique symbol` because this is
a published package surface — a private-symbol-keyed property cannot be named in the
emitted `.d.ts` (TypeBox issue #679), which would break declaration emission and API
Extractor for downstream consumers.

Consumers call `schema.validate(input)` directly; no separate adapter step is required.

## Extends

- [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-__statictype"></a> `__staticType?` | `readonly` | `T` | Phantom type carrier — type-level only, never present at runtime. |
| <a id="property-_type"></a> `_type` | `readonly` | [`SchemaNodeType`](../type-aliases/SchemaNodeType.md) | Runtime discriminant. Identifies the schema node kind. |
| <a id="property-brand"></a> `brand` | `readonly` | `string` \| `undefined` | The brand for a branded type. |
| <a id="property-description"></a> `description?` | `readonly` | `string` | Optional human-readable description emitted into the wire JSON Schema. |
| <a id="property-isoptional"></a> `isOptional` | `readonly` | `boolean` | Indicates whether this element is explicitly optional. |
| <a id="property-traits"></a> `traits` | `readonly` | [`ValidatorTraits`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | [Traits](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) describing this validation. |

## Methods

### convert()

> **convert**(`from`, `context?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

Tests to see if a supplied 'unknown' value matches this validation.  In
contrast to [validate](#validate), makes no guarantees
about the identity of the returned value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` value to be tested. |
| `context?` | `unknown` | Optional validation context. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

Success with the typed, conversion value,
    * or [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with an error message if conversion fails.

#### Inherited from

`Validator.convert`

***

### guard()

> **guard**(`from`, `context?`): `from is T`

Non-throwing type guard

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The value to be tested. |
| `context?` | `unknown` | Optional validation context. |

#### Returns

`from is T`

#### Inherited from

`Validator.guard`

***

### optional()

> **optional**(): [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T` \| `undefined`, `unknown`\>

Creates an [in-place validator](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)
which is derived from this one but which also matches `undefined`.

#### Returns

[`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T` \| `undefined`, `unknown`\>

#### Inherited from

`Validator.optional`

***

### or()

> **or**(`other`): [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\>

Chains this validator with another of the same type, to be attempted if this
validator fails.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `other` | [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\> | The other [Validator](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) to be attempted if this one fails. |

#### Returns

[`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\>

#### Inherited from

`Validator.or`

***

### toJson()

> **toJson**(): [`JsonObject`](../../../interfaces/JsonObject.md)

Emits the standard JSON Schema (draft-07 LLM-tool subset) wire form for this schema.

#### Returns

[`JsonObject`](../../../interfaces/JsonObject.md)

The JSON Schema object describing this schema node.

***

### validate()

> **validate**(`from`, `context?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

Tests to see if a supplied `unknown` value matches this validation.  All
validate calls are guaranteed to return the entity passed in on Success.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` value to be tested. |
| `context?` | `unknown` | Optional validation context. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

Success with the typed, validated value,
    * or [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with an error message if validation fails.

#### Inherited from

`Validator.validate`

***

### validateOptional()

> **validateOptional**(`from`, `context?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T` \| `undefined`\>

Tests to see if a supplied `unknown` value matches this
validation.  Accepts `undefined`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` value to be tested. |
| `context?` | `unknown` | Optional validation context. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T` \| `undefined`\>

Success with the typed, validated value,
    * or [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with an error message if validation fails.

#### Inherited from

`Validator.validateOptional`

***

### withBrand()

> **withBrand**\<`B`\>(`brand`): [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `B`\>, `unknown`\>

Creates a new [in-place validator](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) which
is derived from this one but which matches a branded result.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-b"></a> `B` *extends* `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `brand` | `B` | The brand to be applied. |

#### Returns

[`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `B`\>, `unknown`\>

#### Inherited from

`Validator.withBrand`

***

### withConstraint()

> **withConstraint**(`constraint`, `trait?`): [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\>

Creates an [in-place validator](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)
which is derived from this one but which applies additional constraints.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `constraint` | [`Constraint`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\> | the constraint to be applied |
| `trait?` | [`FunctionConstraintTrait`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | As optional [ConstraintTrait](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) to be applied to the resulting [Validator](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs). |

#### Returns

[`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\>

A new [Validator](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs).

#### Inherited from

`Validator.withConstraint`

***

### withFormattedError()

> **withFormattedError**(`formatter`): [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\>

Creates a new [in-place validator](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) which
is derived from this one but which returns an error message supplied
by the provided formatter if an error occurs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `formatter` | [`ValidationErrorFormatter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\> | The error message formatter to be applied. |

#### Returns

[`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\>

A new [Validator](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs).

#### Inherited from

`Validator.withFormattedError`
