[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / Resource

# Class: Resource

Represents a single logical resource, with a unique id and a set of possible
candidate instances.

## Implements

- [`IResource`](../namespaces/Runtime/interfaces/IResource.md)

## Constructors

### Constructor

> `protected` **new Resource**(`params`): `Resource`

Constructor for a Resource object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IResourceCreateParams`](../namespaces/Resources/interfaces/IResourceCreateParams.md) | [Parameters](../namespaces/Resources/interfaces/IResourceCreateParams.md) used to create the resource. |

#### Returns

`Resource`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="candidates"></a> `candidates` | `readonly` | readonly [`ResourceCandidate`](ResourceCandidate.md)[] | The array of [candidates](ResourceCandidate.md) for the resource. |
| <a id="decision"></a> `decision` | `readonly` | [`ConcreteDecision`](../namespaces/Decisions/classes/ConcreteDecision.md) | [Decision](../namespaces/Decisions/classes/ConcreteDecision.md) for optimized resource resolution. |
| <a id="id"></a> `id` | `readonly` | [`ResourceId`](../type-aliases/ResourceId.md) | The unique [id](../type-aliases/ResourceId.md) of the resource. |
| <a id="name"></a> `name` | `readonly` | [`ResourceName`](../type-aliases/ResourceName.md) | The name of the resource. |
| <a id="resourcetype"></a> `resourceType` | `readonly` | [`ResourceType`](ResourceType.md) | The [type](ResourceType.md) of the resource. |

## Accessors

### resourceTypeName

#### Get Signature

> **get** **resourceTypeName**(): `string`

Gets the resource type name as a string.

##### Returns

`string`

## Methods

### \_getMatchingCandidates()

> `protected` **\_getMatchingCandidates**(`options?`): readonly [`ResourceCandidate`](ResourceCandidate.md)[]

**`Internal`**

Gets the appropriate candidates based on filtering options.
If a validated filter context is provided, returns only matching candidates.
Otherwise returns all candidates.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IResourceDeclarationOptions`](../namespaces/Resources/interfaces/IResourceDeclarationOptions.md) \| [`ICompiledResourceOptionsWithFilter`](../namespaces/Resources/interfaces/ICompiledResourceOptionsWithFilter.md) | Options that may contain a validated filter context |

#### Returns

readonly [`ResourceCandidate`](ResourceCandidate.md)[]

The filtered array of candidates

***

### getCandidatesForContext()

> **getCandidatesForContext**(`context`, `options?`): readonly [`ResourceCandidate`](ResourceCandidate.md)[]

Gets the candidates for this resource that match the specified [context](../namespaces/Context/type-aliases/IValidatedContextDecl.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | [`IValidatedContextDecl`](../namespaces/Context/type-aliases/IValidatedContextDecl.md) | The [context](../namespaces/Context/type-aliases/IValidatedContextDecl.md) to match against. |
| `options?` | [`IContextMatchOptions`](../namespaces/Context/interfaces/IContextMatchOptions.md) | [options](../namespaces/Context/interfaces/IContextMatchOptions.md) for the context match. |

#### Returns

readonly [`ResourceCandidate`](ResourceCandidate.md)[]

The array of [candidates](ResourceCandidate.md) that match the context.

***

### toChildResourceDecl()

> **toChildResourceDecl**(`options?`): [`IChildResourceDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/IChildResourceDecl.md)

Gets the [child resource declaration](../namespaces/ResourceJson/namespaces/Json/interfaces/IChildResourceDecl.md) for this resource.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IResourceDeclarationOptions`](../namespaces/Resources/interfaces/IResourceDeclarationOptions.md) | [options](../namespaces/ResourceJson/namespaces/Helpers/interfaces/IDeclarationOptions.md) for the declaration. |

#### Returns

[`IChildResourceDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/IChildResourceDecl.md)

The [child resource declaration](../namespaces/ResourceJson/namespaces/Json/interfaces/IChildResourceDecl.md).

***

### toCompiled()

> **toCompiled**(`options?`): [`ICompiledResource`](../namespaces/ResourceJson/namespaces/Compiled/interfaces/ICompiledResource.md)

Converts this resource to a compiled resource representation.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IResourceDeclarationOptions`](../namespaces/Resources/interfaces/IResourceDeclarationOptions.md) \| [`ICompiledResourceOptionsWithFilter`](../namespaces/Resources/interfaces/ICompiledResourceOptionsWithFilter.md) | Optional compilation options controlling the output format and filtering. |

#### Returns

[`ICompiledResource`](../namespaces/ResourceJson/namespaces/Compiled/interfaces/ICompiledResource.md)

A compiled resource object that can be used for serialization or runtime processing.

***

### toLooseResourceDecl()

> **toLooseResourceDecl**(`options?`): [`ILooseResourceDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseResourceDecl.md)

Gets the [loose resource declaration](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseResourceDecl.md) for this resource.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IResourceDeclarationOptions`](../namespaces/Resources/interfaces/IResourceDeclarationOptions.md) | [options](../namespaces/Resources/interfaces/IResourceDeclarationOptions.md) for the declaration. |

#### Returns

[`ILooseResourceDecl`](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseResourceDecl.md)

The [loose resource declaration](../namespaces/ResourceJson/namespaces/Json/interfaces/ILooseResourceDecl.md).

***

### create()

> `static` **create**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Resource`\>

Creates a new Resource object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IResourceCreateParams`](../namespaces/Resources/interfaces/IResourceCreateParams.md) | [Parameters](../namespaces/Resources/interfaces/IResourceCreateParams.md) used to create the resource. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Resource`\>

`Success` with the new Resource object if successful,
or `Failure` with an error message if not.
