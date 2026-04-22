[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / ICacheMetrics

# Interface: ICacheMetrics

Cache metrics interface for tracking cache performance.

## Properties

| Property | Type |
| ------ | ------ |
| <a id="clears"></a> `clears` | `number` |
| <a id="errors"></a> `errors` | `number` |
| <a id="hitrate"></a> `hitRate` | `number` |
| <a id="hits"></a> `hits` | `number` |
| <a id="misses"></a> `misses` | `number` |
| <a id="totalaccesses"></a> `totalAccesses` | `number` |

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
