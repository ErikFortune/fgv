[Home](../README.md) > IGridViewInitParams

# Interface: IGridViewInitParams

Configuration for a single grid instance.
Defines resource selection, column mapping, and presentation options.

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

[id](./IGridViewInitParams.id.md)

</td><td>



</td><td>

string

</td><td>

Unique identifier for this grid

</td></tr>
<tr><td>

[title](./IGridViewInitParams.title.md)

</td><td>



</td><td>

string

</td><td>

Display title for this grid

</td></tr>
<tr><td>

[description](./IGridViewInitParams.description.md)

</td><td>



</td><td>

string

</td><td>

Optional description for this grid

</td></tr>
<tr><td>

[resourceSelection](./IGridViewInitParams.resourceSelection.md)

</td><td>



</td><td>

[GridResourceSelector](../type-aliases/GridResourceSelector.md)

</td><td>

How to select resources for this grid

</td></tr>
<tr><td>

[columnMapping](./IGridViewInitParams.columnMapping.md)

</td><td>



</td><td>

[IResourceTypeColumnMapping](IResourceTypeColumnMapping.md)[]

</td><td>

Column mappings for resource types in this grid

</td></tr>
<tr><td>

[presentationOptions](./IGridViewInitParams.presentationOptions.md)

</td><td>



</td><td>

[IGridPresentationOptions](IGridPresentationOptions.md)

</td><td>

Optional presentation overrides

</td></tr>
</tbody></table>
