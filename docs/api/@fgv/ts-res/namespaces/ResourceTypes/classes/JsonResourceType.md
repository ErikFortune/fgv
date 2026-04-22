[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [ResourceTypes](../README.md) / JsonResourceType

# Class: JsonResourceType

Implementation of a [ResourceType](../../../classes/ResourceType.md) for JSON values.

## Extends

- [`ResourceType`](../../../classes/ResourceType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

## Constructors

### Constructor

> `protected` **new JsonResourceType**(`key`, `index?`, `template?`): `JsonResourceType`

Protected JsonResourceType constructor for use by subclasses.
Use [JsonResourceType.create](#create) to create a new instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`ResourceTypeName`](../../../type-aliases/ResourceTypeName.md) | The key for the new JsonResourceType instance. |
| `index?` | `number` | Optional index for the new JsonResourceType instance. |
| `template?` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | - |

#### Returns

`JsonResourceType`

#### Overrides

[`ResourceType`](../../../classes/ResourceType.md).[`constructor`](../../../classes/ResourceType.md#constructor)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="systemtypename"></a> `systemTypeName` | `readonly` | [`ResourceTypeName`](../../../type-aliases/ResourceTypeName.md) | Name of the underlying system type. |

## Accessors

### index

#### Get Signature

> **get** **index**(): [`ResourceTypeIndex`](../../../type-aliases/ResourceTypeIndex.md) \| `undefined`

The index for this resource type.

##### Returns

[`ResourceTypeIndex`](../../../type-aliases/ResourceTypeIndex.md) \| `undefined`

The index for this resource type.

#### Inherited from

[`ResourceType`](../../../classes/ResourceType.md).[`index`](../../../classes/ResourceType.md#index)

***

### key

#### Get Signature

> **get** **key**(): [`ResourceTypeName`](../../../type-aliases/ResourceTypeName.md)

The key for this resource type.

##### Returns

[`ResourceTypeName`](../../../type-aliases/ResourceTypeName.md)

The key for this resource type.

#### Inherited from

[`ResourceType`](../../../classes/ResourceType.md).[`key`](../../../classes/ResourceType.md#key)

## Methods

### createTemplate()

> **createTemplate**(`resourceId`, `init?`, `conditions?`, `resolver?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ILooseResourceDecl`](../../ResourceJson/namespaces/Json/interfaces/ILooseResourceDecl.md)\>

Creates a template for a new resource of this type.
Default implementation provides a basic template.
Subclasses can override to provide type-specific templates.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resourceId` | [`ResourceId`](../../../type-aliases/ResourceId.md) | The id for the new resource |
| `init?` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | An optional initial value for the resource. |
| `conditions?` | [`ConditionSetDecl`](../../ResourceJson/namespaces/Json/type-aliases/ConditionSetDecl.md) | An optional set of conditions that must be met for the resource to be selected. |
| `resolver?` | [`IResourceResolver`](../../../interfaces/IResourceResolver.md) | An optional resource resolver that can be used to create the template. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ILooseResourceDecl`](../../ResourceJson/namespaces/Json/interfaces/ILooseResourceDecl.md)\>

A loose resource declaration with default values for this resource type

#### Inherited from

[`ResourceType`](../../../classes/ResourceType.md).[`createTemplate`](../../../classes/ResourceType.md#createtemplate)

***

### getDefaultTemplateCandidate()

> **getDefaultTemplateCandidate**(`json?`, `conditions?`, `__resolver?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IChildResourceCandidateDecl`](../../ResourceJson/namespaces/Json/interfaces/IChildResourceCandidateDecl.md)\>

Gets the default template value for this resource type.
Subclasses should override this to provide type-specific default values.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `json?` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) |
| `conditions?` | [`ConditionSetDecl`](../../ResourceJson/namespaces/Json/type-aliases/ConditionSetDecl.md) |
| `__resolver?` | [`IResourceResolver`](../../../interfaces/IResourceResolver.md) |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IChildResourceCandidateDecl`](../../ResourceJson/namespaces/Json/interfaces/IChildResourceCandidateDecl.md)\>

The default JSON value for a new resource of this type

#### Inherited from

[`ResourceType`](../../../classes/ResourceType.md).[`getDefaultTemplateCandidate`](../../../classes/ResourceType.md#getdefaulttemplatecandidate)

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

#### Inherited from

[`ResourceType`](../../../classes/ResourceType.md).[`setIndex`](../../../classes/ResourceType.md#setindex)

***

### validate()

#### Call Signature

> **validate**(`json`, `completeness`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

Validates a JSON value for use as a resource instance value.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `json` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The JSON value to validate. |
| `completeness` | [`CandidateCompleteness`](../../../type-aliases/CandidateCompleteness.md) | Describes [how complete](../../../type-aliases/CandidateCompleteness.md) the candidate value is. |

##### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

`Success` with the strongly-typed resource value if the JSON is valid,
`Failure` with an error message otherwise.

##### Overrides

[`ResourceType`](../../../classes/ResourceType.md).[`validate`](../../../classes/ResourceType.md#validate)

#### Call Signature

> **validate**(`json`, `completeness`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

Validates a JSON value for use as a complete resource instance value.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `json` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The JSON value to validate. |
| `completeness` | `"full"` | Must be `'full'` to indicate a complete value. |

##### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

`Success` with the strongly-typed resource value if the JSON is valid,
`Failure` with an error message otherwise.

##### Overrides

[`ResourceType`](../../../classes/ResourceType.md).[`validate`](../../../classes/ResourceType.md#validate)

#### Call Signature

> **validate**(`json`, `completeness`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

Validates a JSON value for use as a partial resource instance value.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `json` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The JSON value to validate. |
| `completeness` | `"partial"` | Must be `'partial'` to indicate a partial value. |

##### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

`Success` with the strongly-typed partial resource value if the JSON is valid,
`Failure` with an error message otherwise.

##### Overrides

[`ResourceType`](../../../classes/ResourceType.md).[`validate`](../../../classes/ResourceType.md#validate)

***

### validateDeclaration()

> **validateDeclaration**(`props`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

Validates properties of a [resource candidate declaration](../../ResourceJson/namespaces/Json/interfaces/ILooseResourceCandidateDecl.md) for
a resource instance value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `props` | [`IResourceCandidateValidationProperties`](../interfaces/IResourceCandidateValidationProperties.md) | The [properties](../interfaces/IResourceCandidateValidationProperties.md) to validate. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

`Success` with the strongly-typed resource value if the JSON and merge method
are valid, `Failure` with an error message otherwise.

#### Overrides

[`ResourceType`](../../../classes/ResourceType.md).[`validateDeclaration`](../../../classes/ResourceType.md#validatedeclaration)

***

### create()

> `static` **create**(`params?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`JsonResourceType`\>

Factory method to create a new JsonResourceType instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`IJsonResourceTypeCreateParams`](../interfaces/IJsonResourceTypeCreateParams.md) | [Parameters](../interfaces/IJsonResourceTypeCreateParams.md) to create the new instance. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`JsonResourceType`\>

`Success` with the new JsonResourceType instance if successful
or `Failure` with an error message if not.
