[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [TsResTools](../README.md) / ICompiledViewProps

# Interface: ICompiledViewProps

Props for the CompiledView component.
Displays the compiled resource collection structure.

## Extends

- [`IViewBaseProps`](../../ViewStateTools/interfaces/IViewBaseProps.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="classname"></a> `className?` | `string` | Additional CSS class names for styling |
| <a id="filterresult"></a> `filterResult?` | [`IFilterResult`](../../FilterTools/interfaces/IFilterResult.md) \| `null` | Result of filtering if applied |
| <a id="filterstate"></a> `filterState?` | [`IFilterState`](../../FilterTools/interfaces/IFilterState.md) | Optional filter state for filtered views |
| <a id="onexport"></a> `onExport?` | (`data`, `type`) => `void` | Callback for exporting compiled data or bundles |
| <a id="pickeroptions"></a> `pickerOptions?` | [`IResourcePickerOptions`](../../PickerTools/interfaces/IResourcePickerOptions.md) | Optional configuration for the ResourcePicker behavior |
| <a id="pickeroptionspanelpresentation"></a> `pickerOptionsPanelPresentation?` | `"inline"` \| `"hidden"` \| `"popover"` \| `"popup"` \| `"collapsible"` | How to present the ResourcePicker options control panel (default: 'hidden' for production use) |
| <a id="resources"></a> `resources?` | [`IExtendedProcessedResources`](../../ResourceTools/interfaces/IExtendedProcessedResources.md) \| `null` | The resource system to display |
| <a id="usenormalization"></a> `useNormalization?` | `boolean` | Whether to use normalization in display |
