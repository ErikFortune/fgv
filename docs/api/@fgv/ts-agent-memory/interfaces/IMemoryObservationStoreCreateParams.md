[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryObservationStoreCreateParams

# Interface: IMemoryObservationStoreCreateParams

Construction options for [MemoryObservationStore.create](../classes/MemoryObservationStore.md#create).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-maxrecords"></a> `maxRecords?` | `readonly` | `number` | Maximum number of observation records retained before the oldest is overwritten. Defaults to `1000`. Must be a positive integer if supplied. |
