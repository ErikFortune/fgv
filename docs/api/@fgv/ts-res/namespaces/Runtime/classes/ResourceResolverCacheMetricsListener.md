[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / ResourceResolverCacheMetricsListener

# Class: ResourceResolverCacheMetricsListener\<TM\>

A metrics implementation of [Runtime.IResourceResolverCacheListener](../interfaces/IResourceResolverCacheListener.md) that tracks
hit counts and rates across all cache types.

## Type Parameters

| Type Parameter |
| ------ |
| `TM` *extends* [`ICacheMetrics`](../interfaces/ICacheMetrics.md) |

## Implements

- [`IResourceResolverCacheListener`](../interfaces/IResourceResolverCacheListener.md)

## Constructors

### Constructor

> **new ResourceResolverCacheMetricsListener**\<`TM`\>(`factory`): `ResourceResolverCacheMetricsListener`\<`TM`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `factory` | () => `TM` |

#### Returns

`ResourceResolverCacheMetricsListener`\<`TM`\>

### Constructor

> **new ResourceResolverCacheMetricsListener**\<`TM`\>(`metrics`): `ResourceResolverCacheMetricsListener`\<`TM`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `metrics` | [`OverallCacheMetrics`](../type-aliases/OverallCacheMetrics.md)\<`TM`\> |

#### Returns

`ResourceResolverCacheMetricsListener`\<`TM`\>

## Accessors

### metrics

#### Get Signature

> **get** **metrics**(): `Readonly`\<[`OverallCacheMetrics`](../type-aliases/OverallCacheMetrics.md)\>

Get the metrics for all cache types.

##### Returns

`Readonly`\<[`OverallCacheMetrics`](../type-aliases/OverallCacheMetrics.md)\>

The metrics for all cache types.

***

### numContextErrors

#### Get Signature

> **get** **numContextErrors**(): `number`

##### Returns

`number`

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

#### Implementation of

[`IResourceResolverCacheListener`](../interfaces/IResourceResolverCacheListener.md).[`onCacheClear`](../interfaces/IResourceResolverCacheListener.md#oncacheclear)

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

#### Implementation of

[`IResourceResolverCacheListener`](../interfaces/IResourceResolverCacheListener.md).[`onCacheError`](../interfaces/IResourceResolverCacheListener.md#oncacheerror)

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

#### Implementation of

[`IResourceResolverCacheListener`](../interfaces/IResourceResolverCacheListener.md).[`onCacheHit`](../interfaces/IResourceResolverCacheListener.md#oncachehit)

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

#### Implementation of

[`IResourceResolverCacheListener`](../interfaces/IResourceResolverCacheListener.md).[`onCacheMiss`](../interfaces/IResourceResolverCacheListener.md#oncachemiss)

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

#### Implementation of

[`IResourceResolverCacheListener`](../interfaces/IResourceResolverCacheListener.md).[`onContextError`](../interfaces/IResourceResolverCacheListener.md#oncontexterror)

***

### reset()

> **reset**(): `void`

Reset all metrics to zero.

#### Returns

`void`
