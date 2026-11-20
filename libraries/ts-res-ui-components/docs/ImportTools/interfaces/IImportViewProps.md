[Home](../../README.md) > [ImportTools](../README.md) > IImportViewProps

# Interface: IImportViewProps

Props for the ImportView component.
Handles importing resource configurations and bundles.

**Extends:** [`IViewBaseProps`](../../interfaces/IViewBaseProps.md)

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[onImport](./IImportViewProps.onImport.md)

</td><td>



</td><td>

(data: FileTree_2) =&gt; void

</td><td>

Callback when resource files/directories are imported

</td></tr>
<tr><td>

[onBundleImport](./IImportViewProps.onBundleImport.md)

</td><td>



</td><td>

(bundle: IBundle) =&gt; void

</td><td>

Callback when a bundle file is imported

</td></tr>
<tr><td>

[onZipImport](./IImportViewProps.onZipImport.md)

</td><td>



</td><td>

(zipData: FileTree_2, config?: ISystemConfiguration) =&gt; void

</td><td>

Callback when a ZIP file is imported with optional configuration

</td></tr>
<tr><td>

[acceptedFileTypes](./IImportViewProps.acceptedFileTypes.md)

</td><td>



</td><td>

string[]

</td><td>

File types accepted for import

</td></tr>
<tr><td>

[importError](./IImportViewProps.importError.md)

</td><td>



</td><td>

string | null

</td><td>

External error state to override local import status

</td></tr>
<tr><td>

[className](./IViewBaseProps.className.md)

</td><td>



</td><td>

string

</td><td>

Additional CSS class names for styling

</td></tr>
<tr><td>

[pickerOptionsPanelPresentation](./IViewBaseProps.pickerOptionsPanelPresentation.md)

</td><td>



</td><td>

"inline" | "hidden" | "popover" | "popup" | "collapsible"

</td><td>

How to present the ResourcePicker options control panel (default: 'hidden' for production use)

</td></tr>
</tbody></table>
