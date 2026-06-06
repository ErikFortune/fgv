[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [ResourceJson](../README.md) / ResourceDeclCollection

# Class: ResourceDeclCollection

Class that extracts resources and candidates from a
[resource collection declaration](../namespaces/Json/interfaces/IResourceCollectionDecl.md).

## Implements

- [`IResourceDeclContainer`](../interfaces/IResourceDeclContainer.md)

## Constructors

### Constructor

> `protected` **new ResourceDeclCollection**(`collection`): `ResourceDeclCollection`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `collection` | [`IImporterResourceCollectionDecl`](../namespaces/Normalized/interfaces/IImporterResourceCollectionDecl.md) |

#### Returns

`ResourceDeclCollection`

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="_candidates"></a> `_candidates` | `protected` | [`IImporterResourceCandidateDecl`](../namespaces/Normalized/interfaces/IImporterResourceCandidateDecl.md)[] | `[]` | - |
| <a id="_resources"></a> `_resources` | `protected` | [`IImporterResourceDecl`](../namespaces/Normalized/type-aliases/IImporterResourceDecl.md)[] | `[]` | - |
| <a id="collection"></a> `collection` | `readonly` | [`IImporterResourceCollectionDecl`](../namespaces/Normalized/interfaces/IImporterResourceCollectionDecl.md) | `undefined` | The [resource collection declaration](../namespaces/Normalized/interfaces/IResourceCollectionDecl.md) being processed. |

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

> **getImporterCandidates**(): readonly [`IImporterResourceCandidateDecl`](../namespaces/Normalized/interfaces/IImporterResourceCandidateDecl.md)[]

Gets the importer candidates extracted from the collection.

#### Returns

readonly [`IImporterResourceCandidateDecl`](../namespaces/Normalized/interfaces/IImporterResourceCandidateDecl.md)[]

The [importer resource candidate declarations](../namespaces/Normalized/interfaces/IImporterResourceCandidateDecl.md)
extracted from the collection.

#### Implementation of

[`IResourceDeclContainer`](../interfaces/IResourceDeclContainer.md).[`getImporterCandidates`](../interfaces/IResourceDeclContainer.md#getimportercandidates)

***

### getImporterResources()

> **getImporterResources**(): readonly [`IImporterResourceDecl`](../namespaces/Normalized/type-aliases/IImporterResourceDecl.md)[]

Gets the importer resources extracted from the collection.

#### Returns

readonly [`IImporterResourceDecl`](../namespaces/Normalized/type-aliases/IImporterResourceDecl.md)[]

The [importer resource declarations](../namespaces/Normalized/type-aliases/IImporterResourceDecl.md)
extracted from the collection.

#### Implementation of

[`IResourceDeclContainer`](../interfaces/IResourceDeclContainer.md).[`getImporterResources`](../interfaces/IResourceDeclContainer.md#getimporterresources)

***

### create()

> `static` **create**(`from`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceDeclCollection`\>

Creates a new ResourceDeclCollection from an
untyped [resource collection declaration](../namespaces/Json/interfaces/IResourceCollectionDecl.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The JSON object to convert. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceDeclCollection`\>

`Success` with the new collection if the JSON object is valid, otherwise `Failure`.
