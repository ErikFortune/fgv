[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskCapacityDimensionStatus

# Interface: ITaskCapacityDimensionStatus

Used, reserved and available for one dimension, with the records that limit it.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-available"></a> `available` | `readonly` | `number` | - |
| <a id="property-dimension"></a> `dimension` | `readonly` | [`CapacityDimension`](../type-aliases/CapacityDimension.md) | - |
| <a id="property-limit"></a> `limit` | `readonly` | `number` | - |
| <a id="property-limitingrecordids"></a> `limitingRecordIds` | `readonly` | readonly `string`[] | - |
| <a id="property-pressure"></a> `pressure` | `readonly` | `boolean` | True once `used + reserved` reaches 80% of `limit`. |
| <a id="property-reserved"></a> `reserved` | `readonly` | `number` | - |
| <a id="property-used"></a> `used` | `readonly` | `number` | - |
