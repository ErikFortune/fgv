[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / ResourceType

# Abstract Class: ResourceType\<T\>

Abstract base class for resource types which are responsible for
validating and converting JSON values into the appropriate strongly-typed
resource value.

## Extended by

- [`JsonResourceType`](../namespaces/ResourceTypes/classes/JsonResourceType.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Implements

- [`IResourceType`](../namespaces/ResourceTypes/interfaces/IResourceType.md)\<`T`\>

## Constructors

### Constructor

> `protected` **new ResourceType**\<`T`\>(`key`, `index?`, `template?`): `ResourceType`\<`T`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | [`ResourceTypeName`](../type-aliases/ResourceTypeName.md) |
| `index?` | `number` |
| `template?` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |

#### Returns

`ResourceType`\<`T`\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="systemtypename"></a> `systemTypeName` | `abstract` | [`ResourceTypeName`](../type-aliases/ResourceTypeName.md) | Name of the underlying system type. |

## Accessors

### index

#### Get Signature

> **get** **index**(): [`ResourceTypeIndex`](../type-aliases/ResourceTypeIndex.md) \| `undefined`

The index for this resource type.

##### Returns

[`ResourceTypeIndex`](../type-aliases/ResourceTypeIndex.md) \| `undefined`

The index for this resource type.

#### Implementation of

[`IResourceType`](../namespaces/ResourceTypes/interfaces/IResourceType.md).[`index`](../namespaces/ResourceTypes/interfaces/IResourceType.md#index)

***

### key

#### Get Signature

> **get** **key**(): [`ResourceTypeName`](../type-aliases/ResourceTypeName.md)

The key for this resource type.

##### Returns

[`ResourceTypeName`](../type-aliases/ResourceTypeName.md)

The key for this resource type.

#### Implementation of

[`IResourceType`](../namespaces/ResourceTypes/interfaces/IResourceType.md).[`key`](../namespaces/ResourceTypes/interfaces/IResourceType.md#key)

## Methods

### createTemplate()

> **createTemplate**(`resourceId`, `init?`, `conditions?`, `resolver?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ILooseResourceDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseResourceDecl.md)\>

Creates a template for a new resource of this type.
Default implementation provides a basic template.
Subclasses can override to provide type-specific templates.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resourceId` | [`ResourceId`](../type-aliases/ResourceId.md) | The id for the new resource |
| `init?` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | An optional initial value for the resource. |
| `conditions?` | [`ConditionSetDecl`](../namespaces/ResourceJson/namespaces/Json/type-aliases/ConditionSetDecl.md) | An optional set of conditions that must be met for the resource to be selected. |
| `resolver?` | [`IResourceResolver`](../interfaces/IResourceResolver.md) | An optional resource resolver that can be used to create the template. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ILooseResourceDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseResourceDecl.md)\>

A loose resource declaration with default values for this resource type

#### Implementation of

[`IResourceType`](../namespaces/ResourceTypes/interfaces/IResourceType.md).[`createTemplate`](../namespaces/ResourceTypes/interfaces/IResourceType.md#createtemplate)

***

### getDefaultTemplateCandidate()

> **getDefaultTemplateCandidate**(`json?`, `conditions?`, `__resolver?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IChildResourceCandidateDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/IChildResourceCandidateDecl.md)\>

Gets the default template value for this resource type.
Subclasses should override this to provide type-specific default values.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `json?` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) |
| `conditions?` | [`ConditionSetDecl`](../namespaces/ResourceJson/namespaces/Json/type-aliases/ConditionSetDecl.md) |
| `__resolver?` | [`IResourceResolver`](../interfaces/IResourceResolver.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IChildResourceCandidateDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/IChildResourceCandidateDecl.md)\>

The default JSON value for a new resource of this type

***

### setIndex()

> **setIndex**(`index`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceTypeIndex`](../type-aliases/ResourceTypeIndex.md)\>

Sets the index for this resource type.  Once set, the index cannot be changed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `index` | `number` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceTypeIndex`](../type-aliases/ResourceTypeIndex.md)\>

#### Implementation of

[`IResourceType`](../namespaces/ResourceTypes/interfaces/IResourceType.md).[`setIndex`](../namespaces/ResourceTypes/interfaces/IResourceType.md#setindex)

***

### validate()

#### Call Signature

> `abstract` **validate**(`json`, `completeness`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Partial`\<`T`\>\>

Validates a JSON value for use as a partial resource instance value.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `json` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | The JSON value to validate. |
| `completeness` | [`CandidateCompleteness`](../type-aliases/CandidateCompleteness.md) | Describes [how complete](../type-aliases/CandidateCompleteness.md) the candidate value is. |

##### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Partial`\<`T`\>\>

`Success` with the strongly-typed partial resource value if the JSON is valid,
`Failure` with an error message otherwise.

##### Implementation of

[`IResourceType`](../namespaces/ResourceTypes/interfaces/IResourceType.md).[`validate`](../namespaces/ResourceTypes/interfaces/IResourceType.md#validate)

#### Call Signature

> `abstract` **validate**(`json`, `completeness`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

Validates a JSON value for use as a complete resource instance value.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `json` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | The JSON value to validate. |
| `completeness` | `"full"` | Describes [how complete](../type-aliases/CandidateCompleteness.md) the candidate value is. |

##### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

`Success` with the strongly-typed resource value if the JSON is valid,
`Failure` with an error message otherwise.

##### Implementation of

[`IResourceType`](../namespaces/ResourceTypes/interfaces/IResourceType.md).[`validate`](../namespaces/ResourceTypes/interfaces/IResourceType.md#validate)

#### Call Signature

> `abstract` **validate**(`json`, `completeness`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Partial`\<`T`\>\>

Validates a JSON value for use as a partial resource instance value.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `json` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | The JSON value to validate. |
| `completeness` | `"partial"` | Describes [how complete](../type-aliases/CandidateCompleteness.md) the candidate value is. |

##### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Partial`\<`T`\>\>

`Success` with the strongly-typed partial resource value if the JSON is valid,
`Failure` with an error message otherwise.

##### Implementation of

[`IResourceType`](../namespaces/ResourceTypes/interfaces/IResourceType.md).[`validate`](../namespaces/ResourceTypes/interfaces/IResourceType.md#validate)

#### Call Signature

> `abstract` **validate**(`json`, `completeness?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`T` \| `Partial`\<`T`\>\>

Validates a JSON value for use as a full or partial resource instance value.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `json` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | The JSON value to validate. |
| `completeness?` | [`CandidateCompleteness`](../type-aliases/CandidateCompleteness.md) | Describes [how complete](../type-aliases/CandidateCompleteness.md) the candidate value is. |

##### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`T` \| `Partial`\<`T`\>\>

`Success` with the strongly-typed full or partial resource value if
the JSON is valid, `Failure` with an error message otherwise.

##### Implementation of

`IResourceType.validate`

***

### validateDeclaration()

> `abstract` **validateDeclaration**(`props`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`T` \| `Partial`\<`T`\>\>

Validates properties of a [resource candidate declaration](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseResourceCandidateDecl.md) for
a resource instance value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `props` | [`IResourceCandidateValidationProperties`](../namespaces/ResourceTypes/interfaces/IResourceCandidateValidationProperties.md) | The [properties](../namespaces/ResourceTypes/interfaces/IResourceCandidateValidationProperties.md) to validate. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`T` \| `Partial`\<`T`\>\>

`Success` with the strongly-typed resource value if the JSON and merge method
are valid, `Failure` with an error message otherwise.

#### Implementation of

[`IResourceType`](../namespaces/ResourceTypes/interfaces/IResourceType.md).[`validateDeclaration`](../namespaces/ResourceTypes/interfaces/IResourceType.md#validatedeclaration)
