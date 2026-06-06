[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / IGridViewProps

# Interface: IGridViewProps

Props for the GridView component.
Displays a single grid instance with resource editing capabilities.

## Extends

- [`IViewBaseProps`](../../ViewStateTools/interfaces/IViewBaseProps.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="availablequalifiers"></a> `availableQualifiers?` | `string`[] | Available qualifiers for context building |
| <a id="classname"></a> `className?` | `string` | Additional CSS class names for styling |
| <a id="contextoptions"></a> `contextOptions?` | [`IResolutionContextOptions`](../../ResolutionTools/interfaces/IResolutionContextOptions.md) | Optional configuration for context controls |
| <a id="filterresult"></a> `filterResult?` | [`IFilterResult`](../../FilterTools/interfaces/IFilterResult.md) \| `null` | Filter results if applied |
| <a id="filterstate"></a> `filterState?` | [`IFilterState`](../../FilterTools/interfaces/IFilterState.md) | Optional filter state integration |
| <a id="gridconfig"></a> `gridConfig` | [`IGridViewInitParams`](IGridViewInitParams.md) | Grid configuration defining what and how to display |
| <a id="pickeroptionspanelpresentation"></a> `pickerOptionsPanelPresentation?` | `"inline"` \| `"hidden"` \| `"popover"` \| `"popup"` \| `"collapsible"` | How to present the ResourcePicker options control panel (default: 'hidden' for production use) |
| <a id="resolutionactions"></a> `resolutionActions?` | [`IResolutionActions`](../../../interfaces/IResolutionActions.md) | Actions for managing resolution state (shared with other views) |
| <a id="resolutionstate"></a> `resolutionState?` | [`IResolutionState`](../../ResolutionTools/interfaces/IResolutionState.md) | Current resolution state (shared with other views) |
| <a id="resources"></a> `resources?` | [`IProcessedResources`](../../ResourceTools/interfaces/IProcessedResources.md) \| `null` | The resource system for resolution |
| <a id="showchangecontrols"></a> `showChangeControls?` | `boolean` | Whether to show change controls (default: true) |
| <a id="showcontextcontrols"></a> `showContextControls?` | `boolean` | Whether to show context controls (default: true) |
