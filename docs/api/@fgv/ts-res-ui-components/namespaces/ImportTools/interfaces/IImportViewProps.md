[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ImportTools](../README.md) / IImportViewProps

# Interface: IImportViewProps

Props for the ImportView component.
Handles importing resource configurations and bundles.

## Extends

- [`IViewBaseProps`](../../ViewStateTools/interfaces/IViewBaseProps.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="acceptedfiletypes"></a> `acceptedFileTypes?` | `string`[] | File types accepted for import |
| <a id="classname"></a> `className?` | `string` | Additional CSS class names for styling |
| <a id="importerror"></a> `importError?` | `string` \| `null` | External error state to override local import status |
| <a id="onbundleimport"></a> `onBundleImport?` | (`bundle`) => `void` | Callback when a bundle file is imported |
| <a id="onimport"></a> `onImport?` | (`data`) => `void` | Callback when resource files/directories are imported |
| <a id="onzipimport"></a> `onZipImport?` | (`zipData`, `config?`) => `void` | Callback when a ZIP file is imported with optional configuration |
| <a id="pickeroptionspanelpresentation"></a> `pickerOptionsPanelPresentation?` | `"inline"` \| `"hidden"` \| `"popover"` \| `"popup"` \| `"collapsible"` | How to present the ResourcePicker options control panel (default: 'hidden' for production use) |
