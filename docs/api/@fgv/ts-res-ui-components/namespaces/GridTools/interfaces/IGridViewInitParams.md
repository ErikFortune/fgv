[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / IGridViewInitParams

# Interface: IGridViewInitParams

Configuration for a single grid instance.
Defines resource selection, column mapping, and presentation options.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-columnmapping"></a> `columnMapping` | [`IResourceTypeColumnMapping`](IResourceTypeColumnMapping.md)[] | Column mappings for resource types in this grid |
| <a id="property-description"></a> `description?` | `string` | Optional description for this grid |
| <a id="property-id"></a> `id` | `string` | Unique identifier for this grid |
| <a id="property-presentationoptions"></a> `presentationOptions?` | [`IGridPresentationOptions`](IGridPresentationOptions.md) | Optional presentation overrides |
| <a id="property-resourceselection"></a> `resourceSelection` | [`GridResourceSelector`](../type-aliases/GridResourceSelector.md) | How to select resources for this grid |
| <a id="property-title"></a> `title` | `string` | Display title for this grid |
