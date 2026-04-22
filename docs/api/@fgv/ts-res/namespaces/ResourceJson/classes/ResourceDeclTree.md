[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [ResourceJson](../README.md) / ResourceDeclTree

# Class: ResourceDeclTree

Class that extracts resources and candidates from a
[resource tree root](../namespaces/Json/interfaces/IResourceTreeRootDecl.md).

## Implements

- [`IResourceDeclContainer`](../interfaces/IResourceDeclContainer.md)

## Constructors

### Constructor

> `protected` **new ResourceDeclTree**(`tree`): `ResourceDeclTree`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tree` | [`IResourceTreeRootDecl`](../namespaces/Normalized/interfaces/IResourceTreeRootDecl.md) |

#### Returns

`ResourceDeclTree`

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="_candidates"></a> `_candidates` | `protected` | [`ILooseResourceCandidateDecl`](../namespaces/Normalized/interfaces/ILooseResourceCandidateDecl.md)[] | `[]` | - |
| <a id="_resources"></a> `_resources` | `protected` | [`ILooseResourceDecl`](../namespaces/Normalized/interfaces/ILooseResourceDecl.md)[] | `[]` | - |
| <a id="tree"></a> `tree` | `readonly` | [`IResourceTreeRootDecl`](../namespaces/Normalized/interfaces/IResourceTreeRootDecl.md) | `undefined` | The [resource tree root declaration](../namespaces/Normalized/interfaces/IResourceTreeRootDecl.md) being processed. |

## Accessors

### context

#### Get Signature

> **get** **context**(): [`IContainerContextDecl`](../namespaces/Normalized/interfaces/IContainerContextDecl.md) \| `undefined`

Optional initial [resource context](../namespaces/Normalized/interfaces/IContainerContextDecl.md)
declaration for the container.

##### Returns

[`IContainerContextDecl`](../namespaces/Normalized/interfaces/IContainerContextDecl.md) \| `undefined`

Optional initial [resource context](../namespaces/Normalized/interfaces/IContainerContextDecl.md)
declaration for the container.

#### Implementation of

[`IResourceDeclContainer`](../interfaces/IResourceDeclContainer.md).[`context`](../interfaces/IResourceDeclContainer.md#context)

## Methods

### getImporterCandidates()

> **getImporterCandidates**(): readonly [`ILooseResourceCandidateDecl`](../namespaces/Normalized/interfaces/ILooseResourceCandidateDecl.md)[]

Gets the loose candidates extracted from the collection.

#### Returns

readonly [`ILooseResourceCandidateDecl`](../namespaces/Normalized/interfaces/ILooseResourceCandidateDecl.md)[]

The [loose resource candidate declarations](../namespaces/Normalized/interfaces/ILooseResourceCandidateDecl.md)
extracted from the collection.

#### Implementation of

[`IResourceDeclContainer`](../interfaces/IResourceDeclContainer.md).[`getImporterCandidates`](../interfaces/IResourceDeclContainer.md#getimportercandidates)

***

### getImporterResources()

> **getImporterResources**(): readonly [`ILooseResourceDecl`](../namespaces/Normalized/interfaces/ILooseResourceDecl.md)[]

Gets the loose resources extracted from the collection.

#### Returns

readonly [`ILooseResourceDecl`](../namespaces/Normalized/interfaces/ILooseResourceDecl.md)[]

The [loose resource declarations](../namespaces/Normalized/interfaces/ILooseResourceDecl.md)
extracted from the collection.

#### Implementation of

[`IResourceDeclContainer`](../interfaces/IResourceDeclContainer.md).[`getImporterResources`](../interfaces/IResourceDeclContainer.md#getimporterresources)

***

### create()

> `static` **create**(`from`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceDeclTree`\>

Creates a new ResourceDeclTree from an
untyped [resource tree root declaration](../namespaces/Json/interfaces/IResourceTreeRootDecl.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The JSON object to convert. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceDeclTree`\>

`Success` with the new tree if the JSON object is valid, otherwise `Failure`.
