[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [ResourceJson](../README.md) / IResourceDeclContainer

# Interface: IResourceDeclContainer

Generic container for resource and resource candidate
declarations.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="context"></a> `context?` | `readonly` | [`IContainerContextDecl`](../namespaces/Normalized/interfaces/IContainerContextDecl.md) | Optional initial [resource context](../namespaces/Normalized/interfaces/IContainerContextDecl.md) declaration for the container. |

## Methods

### getImporterCandidates()

> **getImporterCandidates**(): readonly [`IImporterResourceCandidateDecl`](../namespaces/Normalized/interfaces/IImporterResourceCandidateDecl.md)[]

Gets a normalized array of [importer resource candidate](../namespaces/Normalized/interfaces/IImporterResourceCandidateDecl.md)
declarations for all resources in the container, including children.

#### Returns

readonly [`IImporterResourceCandidateDecl`](../namespaces/Normalized/interfaces/IImporterResourceCandidateDecl.md)[]

***

### getImporterResources()

> **getImporterResources**(): readonly [`IImporterResourceDecl`](../namespaces/Normalized/type-aliases/IImporterResourceDecl.md)[]

Gets a normalized array of [importer resource](../namespaces/Normalized/type-aliases/IImporterResourceDecl.md)
declarations for all resources in the container, including children.

#### Returns

readonly [`IImporterResourceDecl`](../namespaces/Normalized/type-aliases/IImporterResourceDecl.md)[]
