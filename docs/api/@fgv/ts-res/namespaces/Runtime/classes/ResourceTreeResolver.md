[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / ResourceTreeResolver

# Class: ResourceTreeResolver

Specialized resolver for resource tree operations, providing enhanced APIs for
resolving entire resource trees from either resource IDs or pre-built tree nodes.

This class provides a clean separation between individual resource resolution
(handled by ResourceResolver) and tree-based operations, with support for
lazy tree construction and enhanced error handling.

## Constructors

### Constructor

> **new ResourceTreeResolver**(`resolver`): `ResourceTreeResolver`

Creates a ResourceTreeResolver instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resolver` | [`ResourceResolver`](../../../classes/ResourceResolver.md) | The ResourceResolver to use for individual resource resolution |

#### Returns

`ResourceTreeResolver`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="resolver"></a> `resolver` | `readonly` | [`ResourceResolver`](../../../classes/ResourceResolver.md) | The [ResourceResolver](../../../classes/ResourceResolver.md) to use for individual resource resolution |

## Accessors

### tree

#### Get Signature

> **get** **tree**(): [`IReadOnlyResourceTreeRoot`](../namespaces/ResourceTree/interfaces/IReadOnlyResourceTreeRoot.md)\<[`IResource`](../interfaces/IResource.md)\>

Gets the built resource tree, building it lazily on first access.

##### Throws

Error if no resource manager was provided or tree building fails

##### Returns

[`IReadOnlyResourceTreeRoot`](../namespaces/ResourceTree/interfaces/IReadOnlyResourceTreeRoot.md)\<[`IResource`](../interfaces/IResource.md)\>

The resource tree root

## Methods

### resolveComposedResourceTree()

Implementation for both overloads.

#### Call Signature

> **resolveComposedResourceTree**(`resourceId`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) \| `undefined`\>

Resolves a resource tree from a resource ID, building the tree lazily from the resource manager.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resourceId` | `string` | The ID of the root resource to resolve |
| `options?` | [`IResolveResourceTreeOptions`](../interfaces/IResolveResourceTreeOptions.md) | Optional configuration for error handling during resolution |

##### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) \| `undefined`\>

Success with the composed JsonObject or undefined, or Failure with error message

#### Call Signature

> **resolveComposedResourceTree**(`node`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) \| `undefined`\>

Resolves a pre-built resource tree node.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node` | [`IReadOnlyResourceTreeNode`](../namespaces/ResourceTree/type-aliases/IReadOnlyResourceTreeNode.md)\<[`IResource`](../interfaces/IResource.md)\> | The resource tree node to resolve |
| `options?` | [`IResolveResourceTreeOptions`](../interfaces/IResolveResourceTreeOptions.md) | Optional configuration for error handling during resolution |

##### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) \| `undefined`\>

Success with the composed JsonObject or undefined, or Failure with error message

***

### create()

> `static` **create**(`resolver`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceTreeResolver`\>

Creates a ResourceTreeResolver instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resolver` | [`ResourceResolver`](../../../classes/ResourceResolver.md) | The ResourceResolver to use for individual resource resolution |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ResourceTreeResolver`\>
