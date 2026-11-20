[Home](../README.md) > ICompiledViewProps

# Interface: ICompiledViewProps

Props for the CompiledView component.
Displays the compiled resource collection structure.

**Extends:** [`IViewBaseProps`](IViewBaseProps.md)

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

[resources](./ICompiledViewProps.resources.md)

</td><td>



</td><td>

[IExtendedProcessedResources](IExtendedProcessedResources.md) | null

</td><td>

The resource system to display

</td></tr>
<tr><td>

[filterState](./ICompiledViewProps.filterState.md)

</td><td>



</td><td>

[IFilterState](IFilterState.md)

</td><td>

Optional filter state for filtered views

</td></tr>
<tr><td>

[filterResult](./ICompiledViewProps.filterResult.md)

</td><td>



</td><td>

[IFilterResult](IFilterResult.md) | null

</td><td>

Result of filtering if applied

</td></tr>
<tr><td>

[useNormalization](./ICompiledViewProps.useNormalization.md)

</td><td>



</td><td>

boolean

</td><td>

Whether to use normalization in display

</td></tr>
<tr><td>

[onExport](./ICompiledViewProps.onExport.md)

</td><td>



</td><td>

(data: IBundle | ICompiledResourceCollection, type: "json" | "bundle") =&gt; void

</td><td>

Callback for exporting compiled data or bundles

</td></tr>
<tr><td>

[pickerOptions](./ICompiledViewProps.pickerOptions.md)

</td><td>



</td><td>

[IResourcePickerOptions](IResourcePickerOptions.md)

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
