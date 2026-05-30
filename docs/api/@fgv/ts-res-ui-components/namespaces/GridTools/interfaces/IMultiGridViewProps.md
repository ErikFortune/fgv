[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / IMultiGridViewProps

# Interface: IMultiGridViewProps

Props for the MultiGridView component.
Container for multiple grid instances with shared context and batch operations.

## Extends

- [`IViewBaseProps`](../../ViewStateTools/interfaces/IViewBaseProps.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="allowgridreordering"></a> `allowGridReordering?` | `boolean` | Whether users can reorder grid tabs |
| <a id="availablequalifiers"></a> `availableQualifiers?` | `string`[] | Available qualifiers for context building |
| <a id="classname"></a> `className?` | `string` | Additional CSS class names for styling |
| <a id="contextoptions"></a> `contextOptions?` | [`IResolutionContextOptions`](../../ResolutionTools/interfaces/IResolutionContextOptions.md) | Shared context options for all grids |
| <a id="defaultactivegrid"></a> `defaultActiveGrid?` | `string` | ID of the initially active grid |
| <a id="filterresult"></a> `filterResult?` | [`IFilterResult`](../../FilterTools/interfaces/IFilterResult.md) \| `null` | Filter results if applied |
| <a id="filterstate"></a> `filterState?` | [`IFilterState`](../../FilterTools/interfaces/IFilterState.md) | Optional filter state integration |
| <a id="gridconfigurations"></a> `gridConfigurations` | [`IGridViewInitParams`](IGridViewInitParams.md)[] | Multiple grid configurations to display |
| <a id="pickeroptionspanelpresentation"></a> `pickerOptionsPanelPresentation?` | `"inline"` \| `"hidden"` \| `"popover"` \| `"popup"` \| `"collapsible"` | How to present the ResourcePicker options control panel (default: 'hidden' for production use) |
| <a id="resolutionactions"></a> `resolutionActions?` | [`IResolutionActions`](../../../interfaces/IResolutionActions.md) | Shared resolution actions across all grids |
| <a id="resolutionstate"></a> `resolutionState?` | [`IResolutionState`](../../ResolutionTools/interfaces/IResolutionState.md) | Shared resolution state across all grids |
| <a id="resources"></a> `resources?` | [`IProcessedResources`](../../ResourceTools/interfaces/IProcessedResources.md) \| `null` | The resource system for all grids |
| <a id="tabspresentation"></a> `tabsPresentation?` | `"dropdown"` \| `"tabs"` \| `"cards"` \| `"accordion"` | How to present the grid selector |
