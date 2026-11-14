[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / BundleLoader

# Class: BundleLoader

Loader for creating an IResourceManager from a resource bundle.
Handles integrity verification and reconstruction of the runtime resource manager.

## Constructors

### Constructor

> **new BundleLoader**(): `BundleLoader`

#### Returns

`BundleLoader`

## Methods

### createManagerFromBundle()

> `static` **createManagerFromBundle**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IResourceManager`](../interfaces/IResourceManager.md)\<[`IResource`](../namespaces/Runtime/interfaces/IResource.md)\>\>

Creates an IResourceManager from a resource bundle.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IBundleLoaderCreateParams`](../namespaces/Bundle/interfaces/IBundleLoaderCreateParams.md) | Parameters for bundle loading including the bundle and options |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IResourceManager`](../interfaces/IResourceManager.md)\<[`IResource`](../namespaces/Runtime/interfaces/IResource.md)\>\>

Success with the IResourceManager if successful, Failure with error message otherwise
