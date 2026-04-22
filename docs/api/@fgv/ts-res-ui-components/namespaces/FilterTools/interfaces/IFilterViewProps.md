[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [FilterTools](../README.md) / IFilterViewProps

# Interface: IFilterViewProps

Props for the FilterView component.
Provides resource filtering functionality.

## Extends

- [`IViewBaseProps`](../../ViewStateTools/interfaces/IViewBaseProps.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="classname"></a> `className?` | `string` | Additional CSS class names for styling |
| <a id="contextoptions"></a> `contextOptions?` | [`IResolutionContextOptions`](../../ResolutionTools/interfaces/IResolutionContextOptions.md) | Optional configuration for context control behavior |
| <a id="filteractions"></a> `filterActions` | [`IFilterActions`](IFilterActions.md) | Actions for managing filter state |
| <a id="filterresult"></a> `filterResult?` | [`IFilterResult`](IFilterResult.md) \| `null` | Result of applying the filter |
| <a id="filterstate"></a> `filterState` | [`IFilterState`](IFilterState.md) | Current state of the filter configuration |
| <a id="onfilterresult"></a> `onFilterResult?` | (`result`) => `void` | Callback when filter results change |
| <a id="pickeroptions"></a> `pickerOptions?` | [`IResourcePickerOptions`](../../PickerTools/interfaces/IResourcePickerOptions.md) | Optional configuration for the ResourcePicker behavior |
| <a id="pickeroptionspanelpresentation"></a> `pickerOptionsPanelPresentation?` | `"inline"` \| `"hidden"` \| `"popover"` \| `"popup"` \| `"collapsible"` | How to present the ResourcePicker options control panel (default: 'hidden' for production use) |
| <a id="resources"></a> `resources?` | [`IProcessedResources`](../../ResourceTools/interfaces/IProcessedResources.md) \| `null` | The resource system to filter |
