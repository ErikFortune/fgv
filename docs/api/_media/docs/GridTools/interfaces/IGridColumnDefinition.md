[Home](../../README.md) > [GridTools](../README.md) > IGridColumnDefinition

# Interface: IGridColumnDefinition

Configuration for a single column in a resource grid.
Defines how to extract, display, and edit values from resolved resources.

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

[id](./IGridColumnDefinition.id.md)

</td><td>



</td><td>

string

</td><td>

Unique identifier for this column

</td></tr>
<tr><td>

[title](./IGridColumnDefinition.title.md)

</td><td>



</td><td>

string

</td><td>

Display title for the column header

</td></tr>
<tr><td>

[dataPath](./IGridColumnDefinition.dataPath.md)

</td><td>



</td><td>

string | string[]

</td><td>

Path to the property in the resolved resource value (JSONPath-like)

</td></tr>
<tr><td>

[width](./IGridColumnDefinition.width.md)

</td><td>



</td><td>

number

</td><td>

Optional fixed width for the column

</td></tr>
<tr><td>

[sortable](./IGridColumnDefinition.sortable.md)

</td><td>



</td><td>

boolean

</td><td>

Whether this column can be sorted

</td></tr>
<tr><td>

[editable](./IGridColumnDefinition.editable.md)

</td><td>



</td><td>

boolean

</td><td>

Whether values in this column can be edited

</td></tr>
<tr><td>

[cellType](./IGridColumnDefinition.cellType.md)

</td><td>



</td><td>

"string" | "boolean" | "custom" | "tristate" | "dropdown"

</td><td>

Type of cell editor to use

</td></tr>
<tr><td>

[cellRenderer](./IGridColumnDefinition.cellRenderer.md)

</td><td>



</td><td>

ComponentType&lt;[IGridCellProps](../../interfaces/IGridCellProps.md)&gt;

</td><td>

Custom component for rendering cell content

</td></tr>
<tr><td>

[cellEditor](./IGridColumnDefinition.cellEditor.md)

</td><td>



</td><td>

ComponentType&lt;[IGridCellEditorProps](../../interfaces/IGridCellEditorProps.md)&gt;

</td><td>

Custom component for editing cell content

</td></tr>
<tr><td>

[validation](./IGridColumnDefinition.validation.md)

</td><td>



</td><td>

[IGridCellValidation](../../interfaces/IGridCellValidation.md)

</td><td>

Validation configuration for this column

</td></tr>
<tr><td>

[dropdownOptions](./IGridColumnDefinition.dropdownOptions.md)

</td><td>



</td><td>

[IGridDropdownOption](../../interfaces/IGridDropdownOption.md)[] | (() =&gt; Promise&lt;[IGridDropdownOption](../../interfaces/IGridDropdownOption.md)[]&gt;)

</td><td>

Options for dropdown/combobox cells

</td></tr>
<tr><td>

[allowCustomValue](./IGridColumnDefinition.allowCustomValue.md)

</td><td>



</td><td>

boolean

</td><td>

Whether to allow custom values in dropdown (combobox behavior)

</td></tr>
<tr><td>

[triStatePresentation](./IGridColumnDefinition.triStatePresentation.md)

</td><td>



</td><td>

"checkbox" | "dropdown"

</td><td>

Presentation mode for tristate cells

</td></tr>
<tr><td>

[triStateLabels](./IGridColumnDefinition.triStateLabels.md)

</td><td>



</td><td>

{ trueLabel: string; falseLabel: string; undefinedLabel: string }

</td><td>

Custom labels for tristate values

</td></tr>
</tbody></table>
