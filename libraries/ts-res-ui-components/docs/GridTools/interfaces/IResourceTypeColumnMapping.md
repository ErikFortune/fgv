[Home](../../README.md) > [GridTools](../README.md) > IResourceTypeColumnMapping

# Interface: IResourceTypeColumnMapping

Column mapping configuration for a specific resource type.
Defines how resources of a given type should be displayed in the grid.

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

[resourceType](./IResourceTypeColumnMapping.resourceType.md)

</td><td>



</td><td>

string

</td><td>

The resource type this mapping applies to

</td></tr>
<tr><td>

[columns](./IResourceTypeColumnMapping.columns.md)

</td><td>



</td><td>

[IGridColumnDefinition](../../interfaces/IGridColumnDefinition.md)[]

</td><td>

Column definitions for this resource type

</td></tr>
<tr><td>

[defaultColumn](./IResourceTypeColumnMapping.defaultColumn.md)

</td><td>



</td><td>

[IGridColumnDefinition](../../interfaces/IGridColumnDefinition.md)

</td><td>

Optional default column for unmapped properties

</td></tr>
</tbody></table>
