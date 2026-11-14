[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / ICustomResourceSelector

# Interface: ICustomResourceSelector

Custom resource selector for advanced filtering logic.
Allows hosts to define complex resource selection criteria.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-displayname"></a> `displayName?` | `string` | Optional display name for debugging/logging |
| <a id="property-id"></a> `id` | `string` | Unique identifier for this selector |
| <a id="property-select"></a> `select` | (`resources`) => `string`[] | Function that returns resource IDs to include in the grid |
