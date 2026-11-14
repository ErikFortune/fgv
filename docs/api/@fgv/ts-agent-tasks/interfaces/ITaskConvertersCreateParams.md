[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskConvertersCreateParams

# Interface: ITaskConvertersCreateParams

Parameters for [TaskConverters.create](../classes/TaskConverters.md#create).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-bounds"></a> `bounds?` | `readonly` | `Partial`\<[`ITaskFieldBounds`](ITaskFieldBounds.md)\> | Field bounds to apply. Any bound omitted takes its default; any bound supplied must be a positive safe integer no greater than the default, because construction may *lower* the bounds and may not raise them. |
