[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / IResourceResolverCacheListener

# Interface: IResourceResolverCacheListener

A listener for [ResourceResolver](../../../classes/ResourceResolver.md) cache activity.

## Methods

### onCacheClear()

> **onCacheClear**(`cache`): `void`

Called when a cache is cleared.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cache` | [`ResourceResolverCacheType`](../type-aliases/ResourceResolverCacheType.md) | The type of cache that was cleared. |

#### Returns

`void`

***

### onCacheError()

> **onCacheError**(`cache`, `index`): `void`

Called when a cache error occurs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cache` | [`ResourceResolverCacheType`](../type-aliases/ResourceResolverCacheType.md) | The type of cache that had an error. |
| `index` | `number` | The index of the cache that had an error. |

#### Returns

`void`

***

### onCacheHit()

> **onCacheHit**(`cache`, `index`): `void`

Called when a cache hit occurs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cache` | [`ResourceResolverCacheType`](../type-aliases/ResourceResolverCacheType.md) | The type of cache that was hit. |
| `index` | `number` | The index of the cache that was hit. |

#### Returns

`void`

***

### onCacheMiss()

> **onCacheMiss**(`cache`, `index`): `void`

Called when a cache miss occurs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cache` | [`ResourceResolverCacheType`](../type-aliases/ResourceResolverCacheType.md) | The type of cache that was missed. |
| `index` | `number` | The index of the cache that was missed. |

#### Returns

`void`

***

### onContextError()

> **onContextError**(`qualifier`, `error`): `void`

Called when a context error occurs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `qualifier` | `string` | - |
| `error` | `string` | The error that occurred. |

#### Returns

`void`
