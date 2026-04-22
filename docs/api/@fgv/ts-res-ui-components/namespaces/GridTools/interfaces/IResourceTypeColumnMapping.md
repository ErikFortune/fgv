[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / IResourceTypeColumnMapping

# Interface: IResourceTypeColumnMapping

Column mapping configuration for a specific resource type.
Defines how resources of a given type should be displayed in the grid.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="columns"></a> `columns` | [`IGridColumnDefinition`](IGridColumnDefinition.md)[] | Column definitions for this resource type |
| <a id="defaultcolumn"></a> `defaultColumn?` | [`IGridColumnDefinition`](IGridColumnDefinition.md) | Optional default column for unmapped properties |
| <a id="resourcetype"></a> `resourceType` | `string` | The resource type this mapping applies to |
