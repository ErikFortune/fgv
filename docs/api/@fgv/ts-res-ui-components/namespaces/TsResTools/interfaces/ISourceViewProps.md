[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [TsResTools](../README.md) / ISourceViewProps

# Interface: ISourceViewProps

Props for the SourceView component.
Displays and manages the source resource collection.

## Extends

- [`IViewBaseProps`](../../ViewStateTools/interfaces/IViewBaseProps.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="classname"></a> `className?` | `string` | Additional CSS class names for styling |
| <a id="filterresult"></a> `filterResult?` | [`IFilterResult`](../../FilterTools/interfaces/IFilterResult.md) \| `null` | Result of filtering if applied |
| <a id="filterstate"></a> `filterState?` | [`IFilterState`](../../FilterTools/interfaces/IFilterState.md) | Optional filter state for filtered views |
| <a id="onexport"></a> `onExport?` | (`data`, `type`) => `void` | Callback when exporting resource collection data |
| <a id="onresourceselect"></a> `onResourceSelect?` | (`resourceId`) => `void` | Callback when a resource is selected |
| <a id="pickeroptions"></a> `pickerOptions?` | [`IResourcePickerOptions`](../../PickerTools/interfaces/IResourcePickerOptions.md) | Optional configuration for the ResourcePicker behavior |
| <a id="pickeroptionspanelpresentation"></a> `pickerOptionsPanelPresentation?` | `"inline"` \| `"hidden"` \| `"popover"` \| `"popup"` \| `"collapsible"` | How to present the ResourcePicker options control panel (default: 'hidden' for production use) |
| <a id="resources"></a> `resources?` | [`IExtendedProcessedResources`](../../ResourceTools/interfaces/IExtendedProcessedResources.md) \| `null` | The processed resource system to display |
| <a id="selectedresourceid"></a> `selectedResourceId?` | `string` \| `null` | Currently selected resource ID for detailed view |
