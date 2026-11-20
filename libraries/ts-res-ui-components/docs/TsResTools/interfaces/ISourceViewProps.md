[Home](../../README.md) > [TsResTools](../README.md) > ISourceViewProps

# Interface: ISourceViewProps

Props for the SourceView component.
Displays and manages the source resource collection.

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

[resources](./ISourceViewProps.resources.md)

</td><td>



</td><td>

[IExtendedProcessedResources](../../interfaces/IExtendedProcessedResources.md) | null

</td><td>

The processed resource system to display

</td></tr>
<tr><td>

[filterState](./ISourceViewProps.filterState.md)

</td><td>



</td><td>

[IFilterState](../../interfaces/IFilterState.md)

</td><td>

Optional filter state for filtered views

</td></tr>
<tr><td>

[filterResult](./ISourceViewProps.filterResult.md)

</td><td>



</td><td>

[IFilterResult](../../interfaces/IFilterResult.md) | null

</td><td>

Result of filtering if applied

</td></tr>
<tr><td>

[selectedResourceId](./ISourceViewProps.selectedResourceId.md)

</td><td>



</td><td>

string | null

</td><td>

Currently selected resource ID for detailed view

</td></tr>
<tr><td>

[onResourceSelect](./ISourceViewProps.onResourceSelect.md)

</td><td>



</td><td>

(resourceId: string) =&gt; void

</td><td>

Callback when a resource is selected

</td></tr>
<tr><td>

[onExport](./ISourceViewProps.onExport.md)

</td><td>



</td><td>

(data: unknown, type: "json") =&gt; void

</td><td>

Callback when exporting resource collection data

</td></tr>
<tr><td>

[pickerOptions](./ISourceViewProps.pickerOptions.md)

</td><td>



</td><td>

[IResourcePickerOptions](../../interfaces/IResourcePickerOptions.md)

</td><td>

Optional configuration for the ResourcePicker behavior

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
