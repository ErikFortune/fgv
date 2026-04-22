[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / Qualifier

# Class: Qualifier

Represents a qualifier that can be used to identify the context in
which a resource is used.

## Implements

- [`IValidatedQualifierDecl`](../namespaces/Qualifiers/interfaces/IValidatedQualifierDecl.md)
- [`ICollectible`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierName`](../type-aliases/QualifierName.md), [`QualifierIndex`](../type-aliases/QualifierIndex.md)\>

## Constructors

### Constructor

> `protected` **new Qualifier**(`decl`): `Qualifier`

Constructs a new instance of a Qualifier from the
supplied [validated declaration](../namespaces/Qualifiers/interfaces/IValidatedQualifierDecl.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `decl` | [`IValidatedQualifierDecl`](../namespaces/Qualifiers/interfaces/IValidatedQualifierDecl.md) | The [validated declaration](../namespaces/Qualifiers/interfaces/IValidatedQualifierDecl.md) describing the qualifier to construct. |

#### Returns

`Qualifier`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_collectible"></a> `_collectible` | `readonly` | [`Collectible`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierName`](../type-aliases/QualifierName.md), [`QualifierIndex`](../type-aliases/QualifierIndex.md)\> | - |
| <a id="defaultpriority"></a> `defaultPriority` | `readonly` | [`ConditionPriority`](../type-aliases/ConditionPriority.md) | The default [priority](../type-aliases/ConditionPriority.md) of conditions that depend on this qualifier. |
| <a id="defaultvalue"></a> `defaultValue?` | `readonly` | [`QualifierContextValue`](../type-aliases/QualifierContextValue.md) | Optional default value for the qualifier. |
| <a id="name"></a> `name` | `readonly` | [`QualifierName`](../type-aliases/QualifierName.md) | The name of the qualifier. |
| <a id="token"></a> `token` | `readonly` | [`QualifierName`](../type-aliases/QualifierName.md) | The token used to identify the qualifier in the name or path of a resource being imported. |
| <a id="tokenisoptional"></a> `tokenIsOptional` | `readonly` | `boolean` | Indicates whether the token is optional in the name or path of a resource being imported. |
| <a id="type"></a> `type` | `readonly` | [`QualifierType`](QualifierType.md) | The [type](QualifierType.md) of the qualifier. |

## Accessors

### index

#### Get Signature

> **get** **index**(): [`QualifierIndex`](../type-aliases/QualifierIndex.md) \| `undefined`

The index of the qualifier.

##### Returns

[`QualifierIndex`](../type-aliases/QualifierIndex.md) \| `undefined`

Index of the qualifier.

#### Implementation of

[`IValidatedQualifierDecl`](../namespaces/Qualifiers/interfaces/IValidatedQualifierDecl.md).[`index`](../namespaces/Qualifiers/interfaces/IValidatedQualifierDecl.md#index)

***

### key

#### Get Signature

> **get** **key**(): [`QualifierName`](../type-aliases/QualifierName.md)

The collector key for this qualifier.

##### Returns

[`QualifierName`](../type-aliases/QualifierName.md)

#### Implementation of

`ICollectible.key`

## Methods

### isValidConditionValue()

> **isValidConditionValue**(`value`): `value is QualifierConditionValue`

Validates a condition value for this qualifier type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `string` | The string value to validate. |

#### Returns

`value is QualifierConditionValue`

`Success` with the [validated value](../type-aliases/QualifierConditionValue.md)
if the value is valid for use in a condition, `Failure` with error details
otherwise.

***

### isValidContextValue()

> **isValidContextValue**(`value`): `value is QualifierContextValue`

Validates a context value for this qualifier type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `string` | The string value to validate. |

#### Returns

`value is QualifierContextValue`

`Success` with the [validated value](../type-aliases/QualifierContextValue.md)
if the value is valid for use in a runtime context, `Failure` with error
details otherwise.

***

### setIndex()

> **setIndex**(`index`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierIndex`](../type-aliases/QualifierIndex.md)\>

Sets the index of this qualifier.  Once set, the index cannot be changed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `index` | [`QualifierIndex`](../type-aliases/QualifierIndex.md) | The index to set. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierIndex`](../type-aliases/QualifierIndex.md)\>

`Success` with the index if successful, `Failure` with an error message otherwise.

#### Implementation of

`ICollectible.setIndex`

***

### validateCondition()

> **validateCondition**(`value`, `operator?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierConditionValue`](../type-aliases/QualifierConditionValue.md)\>

Validates that a value and optional operator are valid for use in a condition
for qualifiers of this type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `string` | The string value to validate. |
| `operator?` | [`ConditionOperator`](../type-aliases/ConditionOperator.md) | An optional operator to validate. Defaults to 'matches'. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierConditionValue`](../type-aliases/QualifierConditionValue.md)\>

***

### validateContextValue()

> **validateContextValue**(`value`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../type-aliases/QualifierContextValue.md)\>

Validates that a value is valid for use in a runtime context for qualifiers
of this type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `string` | The string value to validate. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../type-aliases/QualifierContextValue.md)\>

`Success` with the [validated value](../type-aliases/QualifierContextValue.md)
if the value is valid for use in a runtime context, `Failure` with error
details otherwise.

***

### create()

> `static` **create**(`decl`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Qualifier`\>

Creates a new instance of a Qualifier from the
supplied [validated declaration](../namespaces/Qualifiers/interfaces/IValidatedQualifierDecl.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `decl` | [`IValidatedQualifierDecl`](../namespaces/Qualifiers/interfaces/IValidatedQualifierDecl.md) | The [validated declaration](../namespaces/Qualifiers/interfaces/IValidatedQualifierDecl.md) for the new instance. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Qualifier`\>

`Success` with the new Qualifier if successful,
`Failure` with an error message otherwise.
