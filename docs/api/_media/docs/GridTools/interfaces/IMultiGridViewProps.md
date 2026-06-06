[Home](../../README.md) > [GridTools](../README.md) > IMultiGridViewProps

# Interface: IMultiGridViewProps

Props for the MultiGridView component.
Container for multiple grid instances with shared context and batch operations.

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

[gridConfigurations](./IMultiGridViewProps.gridConfigurations.md)

</td><td>



</td><td>

[IGridViewInitParams](../../interfaces/IGridViewInitParams.md)[]

</td><td>

Multiple grid configurations to display

</td></tr>
<tr><td>

[resources](./IMultiGridViewProps.resources.md)

</td><td>



</td><td>

[IProcessedResources](../../interfaces/IProcessedResources.md) | null

</td><td>

The resource system for all grids

</td></tr>
<tr><td>

[resolutionState](./IMultiGridViewProps.resolutionState.md)

</td><td>



</td><td>

[IResolutionState](../../interfaces/IResolutionState.md)

</td><td>

Shared resolution state across all grids

</td></tr>
<tr><td>

[resolutionActions](./IMultiGridViewProps.resolutionActions.md)

</td><td>



</td><td>

[IResolutionActions](../../interfaces/IResolutionActions.md)

</td><td>

Shared resolution actions across all grids

</td></tr>
<tr><td>

[availableQualifiers](./IMultiGridViewProps.availableQualifiers.md)

</td><td>



</td><td>

string[]

</td><td>

Available qualifiers for context building

</td></tr>
<tr><td>

[contextOptions](./IMultiGridViewProps.contextOptions.md)

</td><td>



</td><td>

[IResolutionContextOptions](../../interfaces/IResolutionContextOptions.md)

</td><td>

Shared context options for all grids

</td></tr>
<tr><td>

[filterState](./IMultiGridViewProps.filterState.md)

</td><td>



</td><td>

[IFilterState](../../interfaces/IFilterState.md)

</td><td>

Optional filter state integration

</td></tr>
<tr><td>

[filterResult](./IMultiGridViewProps.filterResult.md)

</td><td>



</td><td>

[IFilterResult](../../interfaces/IFilterResult.md) | null

</td><td>

Filter results if applied

</td></tr>
<tr><td>

[tabsPresentation](./IMultiGridViewProps.tabsPresentation.md)

</td><td>



</td><td>

"dropdown" | "tabs" | "cards" | "accordion"

</td><td>

How to present the grid selector

</td></tr>
<tr><td>

[defaultActiveGrid](./IMultiGridViewProps.defaultActiveGrid.md)

</td><td>



</td><td>

string

</td><td>

ID of the initially active grid

</td></tr>
<tr><td>

[allowGridReordering](./IMultiGridViewProps.allowGridReordering.md)

</td><td>



</td><td>

boolean

</td><td>

Whether users can reorder grid tabs

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
