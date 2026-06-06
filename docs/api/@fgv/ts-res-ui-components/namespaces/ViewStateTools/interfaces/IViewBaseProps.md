[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ViewStateTools](../README.md) / IViewBaseProps

# Interface: IViewBaseProps

Base properties shared by all view components.
Provides common functionality for messaging and styling.

## Extended by

- [`IFilterViewProps`](../../FilterTools/interfaces/IFilterViewProps.md)
- [`IResolutionViewProps`](../../ResolutionTools/interfaces/IResolutionViewProps.md)
- [`IConfigurationViewProps`](../../ConfigurationTools/interfaces/IConfigurationViewProps.md)
- [`IImportViewProps`](../../ImportTools/interfaces/IImportViewProps.md)
- [`ISourceViewProps`](../../TsResTools/interfaces/ISourceViewProps.md)
- [`ICompiledViewProps`](../../TsResTools/interfaces/ICompiledViewProps.md)
- [`IResourcePickerProps`](../../PickerTools/interfaces/IResourcePickerProps.md)
- [`IGridViewProps`](../../GridTools/interfaces/IGridViewProps.md)
- [`IMultiGridViewProps`](../../GridTools/interfaces/IMultiGridViewProps.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="classname"></a> `className?` | `string` | Additional CSS class names for styling |
| <a id="pickeroptionspanelpresentation"></a> `pickerOptionsPanelPresentation?` | `"inline"` \| `"hidden"` \| `"popover"` \| `"popup"` \| `"collapsible"` | How to present the ResourcePicker options control panel (default: 'hidden' for production use) |
