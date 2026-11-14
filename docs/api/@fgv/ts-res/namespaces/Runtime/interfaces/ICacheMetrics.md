[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / ICacheMetrics

# Interface: ICacheMetrics

Cache metrics interface for tracking cache performance.

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-clears"></a> `clears` | `number` |
| <a id="property-errors"></a> `errors` | `number` |
| <a id="property-hitrate"></a> `hitRate` | `number` |
| <a id="property-hits"></a> `hits` | `number` |
| <a id="property-misses"></a> `misses` | `number` |
| <a id="property-totalaccesses"></a> `totalAccesses` | `number` |

## Methods

### onClear()

> **onClear**(): `void`

#### Returns

`void`

***

### onError()

> **onError**(`index`): `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `index` | `number` |

#### Returns

`void`

***

### onHit()

> **onHit**(`index`): `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `index` | `number` |

#### Returns

`void`

***

### onMiss()

> **onMiss**(`index`): `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `index` | `number` |

#### Returns

`void`

***

### reset()

> **reset**(): `void`

#### Returns

`void`
