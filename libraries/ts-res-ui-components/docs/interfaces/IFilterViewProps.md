[Home](../README.md) > IFilterViewProps

# Interface: IFilterViewProps

Props for the FilterView component.
Provides resource filtering functionality.

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

[resources](./IFilterViewProps.resources.md)

</td><td>



</td><td>

[IProcessedResources](IProcessedResources.md) | null

</td><td>

The resource system to filter

</td></tr>
<tr><td>

[filterState](./IFilterViewProps.filterState.md)

</td><td>



</td><td>

[IFilterState](IFilterState.md)

</td><td>

Current state of the filter configuration

</td></tr>
<tr><td>

[filterActions](./IFilterViewProps.filterActions.md)

</td><td>



</td><td>

[IFilterActions](IFilterActions.md)

</td><td>

Actions for managing filter state

</td></tr>
<tr><td>

[filterResult](./IFilterViewProps.filterResult.md)

</td><td>



</td><td>

[IFilterResult](IFilterResult.md) | null

</td><td>

Result of applying the filter

</td></tr>
<tr><td>

[onFilterResult](./IFilterViewProps.onFilterResult.md)

</td><td>



</td><td>

(result: [IFilterResult](IFilterResult.md) | null) =&gt; void

</td><td>

Callback when filter results change

</td></tr>
<tr><td>

[pickerOptions](./IFilterViewProps.pickerOptions.md)

</td><td>



</td><td>

[IResourcePickerOptions](IResourcePickerOptions.md)

</td><td>

Optional configuration for the ResourcePicker behavior

</td></tr>
<tr><td>

[contextOptions](./IFilterViewProps.contextOptions.md)

</td><td>



</td><td>

[IResolutionContextOptions](IResolutionContextOptions.md)

</td><td>

Optional configuration for context control behavior

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
