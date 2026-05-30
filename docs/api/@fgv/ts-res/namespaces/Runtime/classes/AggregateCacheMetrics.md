[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / AggregateCacheMetrics

# Class: AggregateCacheMetrics

Aggregate cache metrics for a specific cache type.

## Implements

- [`ICacheMetrics`](../interfaces/ICacheMetrics.md)

## Constructors

### Constructor

> **new AggregateCacheMetrics**(): `AggregateCacheMetrics`

#### Returns

`AggregateCacheMetrics`

## Accessors

### clears

#### Get Signature

> **get** **clears**(): `number`

##### Returns

`number`

#### Implementation of

[`ICacheMetrics`](../interfaces/ICacheMetrics.md).[`clears`](../interfaces/ICacheMetrics.md#clears)

***

### errorRate

#### Get Signature

> **get** **errorRate**(): `number`

##### Returns

`number`

***

### errors

#### Get Signature

> **get** **errors**(): `number`

##### Returns

`number`

#### Implementation of

[`ICacheMetrics`](../interfaces/ICacheMetrics.md).[`errors`](../interfaces/ICacheMetrics.md#errors)

***

### hitRate

#### Get Signature

> **get** **hitRate**(): `number`

##### Returns

`number`

#### Implementation of

[`ICacheMetrics`](../interfaces/ICacheMetrics.md).[`hitRate`](../interfaces/ICacheMetrics.md#hitrate)

***

### hits

#### Get Signature

> **get** **hits**(): `number`

##### Returns

`number`

#### Implementation of

[`ICacheMetrics`](../interfaces/ICacheMetrics.md).[`hits`](../interfaces/ICacheMetrics.md#hits)

***

### misses

#### Get Signature

> **get** **misses**(): `number`

##### Returns

`number`

#### Implementation of

[`ICacheMetrics`](../interfaces/ICacheMetrics.md).[`misses`](../interfaces/ICacheMetrics.md#misses)

***

### totalAccesses

#### Get Signature

> **get** **totalAccesses**(): `number`

##### Returns

`number`

#### Implementation of

[`ICacheMetrics`](../interfaces/ICacheMetrics.md).[`totalAccesses`](../interfaces/ICacheMetrics.md#totalaccesses)

## Methods

### onClear()

> **onClear**(): `void`

#### Returns

`void`

#### Implementation of

[`ICacheMetrics`](../interfaces/ICacheMetrics.md).[`onClear`](../interfaces/ICacheMetrics.md#onclear)

***

### onError()

> **onError**(`__index`): `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `__index` | `number` |

#### Returns

`void`

#### Implementation of

[`ICacheMetrics`](../interfaces/ICacheMetrics.md).[`onError`](../interfaces/ICacheMetrics.md#onerror)

***

### onHit()

> **onHit**(`__index`): `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `__index` | `number` |

#### Returns

`void`

#### Implementation of

[`ICacheMetrics`](../interfaces/ICacheMetrics.md).[`onHit`](../interfaces/ICacheMetrics.md#onhit)

***

### onMiss()

> **onMiss**(`__index`): `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `__index` | `number` |

#### Returns

`void`

#### Implementation of

[`ICacheMetrics`](../interfaces/ICacheMetrics.md).[`onMiss`](../interfaces/ICacheMetrics.md#onmiss)

***

### reset()

> **reset**(): `void`

#### Returns

`void`

#### Implementation of

[`ICacheMetrics`](../interfaces/ICacheMetrics.md).[`reset`](../interfaces/ICacheMetrics.md#reset)
