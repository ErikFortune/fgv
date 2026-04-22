[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / IGridViewInitParams

# Interface: IGridViewInitParams

Configuration for a single grid instance.
Defines resource selection, column mapping, and presentation options.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="columnmapping"></a> `columnMapping` | [`IResourceTypeColumnMapping`](IResourceTypeColumnMapping.md)[] | Column mappings for resource types in this grid |
| <a id="description"></a> `description?` | `string` | Optional description for this grid |
| <a id="id"></a> `id` | `string` | Unique identifier for this grid |
| <a id="presentationoptions"></a> `presentationOptions?` | [`IGridPresentationOptions`](IGridPresentationOptions.md) | Optional presentation overrides |
| <a id="resourceselection"></a> `resourceSelection` | [`GridResourceSelector`](../type-aliases/GridResourceSelector.md) | How to select resources for this grid |
| <a id="title"></a> `title` | `string` | Display title for this grid |
