[Home](../README.md) > IGridViewProps

# Interface: IGridViewProps

Props for the GridView component.
Displays a single grid instance with resource editing capabilities.

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

[gridConfig](./IGridViewProps.gridConfig.md)

</td><td>



</td><td>

[IGridViewInitParams](IGridViewInitParams.md)

</td><td>

Grid configuration defining what and how to display

</td></tr>
<tr><td>

[resources](./IGridViewProps.resources.md)

</td><td>



</td><td>

[IProcessedResources](IProcessedResources.md) | null

</td><td>

The resource system for resolution

</td></tr>
<tr><td>

[resolutionState](./IGridViewProps.resolutionState.md)

</td><td>



</td><td>

[IResolutionState](IResolutionState.md)

</td><td>

Current resolution state (shared with other views)

</td></tr>
<tr><td>

[resolutionActions](./IGridViewProps.resolutionActions.md)

</td><td>



</td><td>

[IResolutionActions](IResolutionActions.md)

</td><td>

Actions for managing resolution state (shared with other views)

</td></tr>
<tr><td>

[availableQualifiers](./IGridViewProps.availableQualifiers.md)

</td><td>



</td><td>

string[]

</td><td>

Available qualifiers for context building

</td></tr>
<tr><td>

[contextOptions](./IGridViewProps.contextOptions.md)

</td><td>



</td><td>

[IResolutionContextOptions](IResolutionContextOptions.md)

</td><td>

Optional configuration for context controls

</td></tr>
<tr><td>

[filterState](./IGridViewProps.filterState.md)

</td><td>



</td><td>

[IFilterState](IFilterState.md)

</td><td>

Optional filter state integration

</td></tr>
<tr><td>

[filterResult](./IGridViewProps.filterResult.md)

</td><td>



</td><td>

[IFilterResult](IFilterResult.md) | null

</td><td>

Filter results if applied

</td></tr>
<tr><td>

[showContextControls](./IGridViewProps.showContextControls.md)

</td><td>



</td><td>

boolean

</td><td>

Whether to show context controls (default: true)

</td></tr>
<tr><td>

[showChangeControls](./IGridViewProps.showChangeControls.md)

</td><td>



</td><td>

boolean

</td><td>

Whether to show change controls (default: true)

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
