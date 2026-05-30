[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [ResourceTypes](../README.md) / IResourceType

# Interface: IResourceType\<T\>

Interface for a resource type.  Resource types are responsible for
validating and converting JSON values into the appropriate strongly-typed
resource value.

## Extends

- [`ICollectible`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceTypeName`](../../../type-aliases/ResourceTypeName.md), [`ResourceTypeIndex`](../../../type-aliases/ResourceTypeIndex.md)\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="index"></a> `index` | `readonly` | [`ResourceTypeIndex`](../../../type-aliases/ResourceTypeIndex.md) \| `undefined` | The index for this resource type. |
| <a id="key"></a> `key` | `readonly` | [`ResourceTypeName`](../../../type-aliases/ResourceTypeName.md) | The key for this resource type. |

## Methods

### createTemplate()

> **createTemplate**(`resourceId`, `init?`, `conditions?`, `resolver?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ILooseResourceDecl`](../../ResourceJson/namespaces/Json/interfaces/ILooseResourceDecl.md)\>

Creates a template for a new resource of this type.
The template provides a default structure for creating new resource instances.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resourceId` | [`ResourceId`](../../../type-aliases/ResourceId.md) | The id for the new resource. |
| `init?` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | An optional initial value for the resource. |
| `conditions?` | [`ConditionSetDecl`](../../ResourceJson/namespaces/Json/type-aliases/ConditionSetDecl.md) | An optional set of conditions that must be met for the resource to be selected. |
| `resolver?` | [`IResourceResolver`](../../../interfaces/IResourceResolver.md) | An optional resource resolver that can be used to create the template. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ILooseResourceDecl`](../../ResourceJson/namespaces/Json/interfaces/ILooseResourceDecl.md)\>

A loose resource declaration with default values for this resource type.

***

### setIndex()

> **setIndex**(`index`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceTypeIndex`](../../../type-aliases/ResourceTypeIndex.md)\>

Sets the index for this resource type.  Once set, the index cannot be changed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `index` | `number` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceTypeIndex`](../../../type-aliases/ResourceTypeIndex.md)\>

#### Overrides

`ICollectible.setIndex`

***

### validate()

#### Call Signature

> **validate**(`json`, `completeness`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Partial`\<`T`\>\>

Validates a JSON value for use as a partial resource instance value.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `json` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | The JSON value to validate. |
| `completeness` | [`CandidateCompleteness`](../../../type-aliases/CandidateCompleteness.md) | Describes [how complete](../../../type-aliases/CandidateCompleteness.md) the candidate value is. |

##### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Partial`\<`T`\>\>

`Success` with the strongly-typed partial resource value if the JSON is valid,
`Failure` with an error message otherwise.

#### Call Signature

> **validate**(`json`, `completeness`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

Validates a JSON value for use as a complete resource instance value.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `json` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | The JSON value to validate. |
| `completeness` | `"full"` | Describes [how complete](../../../type-aliases/CandidateCompleteness.md) the candidate value is. |

##### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

`Success` with the strongly-typed resource value if the JSON is valid,
`Failure` with an error message otherwise.

#### Call Signature

> **validate**(`json`, `completeness`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Partial`\<`T`\>\>

Validates a JSON value for use as a partial resource instance value.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `json` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | The JSON value to validate. |
| `completeness` | `"partial"` | Describes [how complete](../../../type-aliases/CandidateCompleteness.md) the candidate value is. |

##### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Partial`\<`T`\>\>

`Success` with the strongly-typed partial resource value if the JSON is valid,
`Failure` with an error message otherwise.

***

### validateDeclaration()

> **validateDeclaration**(`props`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T` \| `Partial`\<`T`\>\>

Validates properties of a [resource candidate declaration](../../ResourceJson/namespaces/Json/interfaces/ILooseResourceCandidateDecl.md) for
a resource instance value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `props` | [`IResourceCandidateValidationProperties`](IResourceCandidateValidationProperties.md) | The [properties](IResourceCandidateValidationProperties.md) to validate. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T` \| `Partial`\<`T`\>\>

`Success` with the strongly-typed resource value if the JSON and merge method
are valid, `Failure` with an error message otherwise.
