[Home](../../README.md) > [GridTools](../README.md) > IGridCellEditorProps

# Interface: IGridCellEditorProps

Props passed to custom grid cell editors.

**Extends:** [`IGridCellProps`](../../interfaces/IGridCellProps.md)

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

[editedValue](./IGridCellEditorProps.editedValue.md)

</td><td>



</td><td>

[JsonValue](../../type-aliases/JsonValue.md)

</td><td>

The current edited value if any

</td></tr>
<tr><td>

[onSave](./IGridCellEditorProps.onSave.md)

</td><td>



</td><td>

(resourceId: string, newValue: [JsonValue](../../type-aliases/JsonValue.md), originalValue: [JsonValue](../../type-aliases/JsonValue.md)) =&gt; void

</td><td>

Callback when the user saves an edit

</td></tr>
<tr><td>

[onCancel](./IGridCellEditorProps.onCancel.md)

</td><td>



</td><td>

() =&gt; void

</td><td>

Callback when the user cancels an edit

</td></tr>
<tr><td>

[disabled](./IGridCellEditorProps.disabled.md)

</td><td>



</td><td>

boolean

</td><td>

Whether editing is currently disabled

</td></tr>
<tr><td>

[value](./IGridCellProps.value.md)

</td><td>



</td><td>

[JsonValue](../../type-aliases/JsonValue.md)

</td><td>

The extracted value for this cell

</td></tr>
<tr><td>

[resourceId](./IGridCellProps.resourceId.md)

</td><td>



</td><td>

string

</td><td>

The resource ID for this row

</td></tr>
<tr><td>

[column](./IGridCellProps.column.md)

</td><td>



</td><td>

[IGridColumnDefinition](../../interfaces/IGridColumnDefinition.md)

</td><td>

The column definition for this cell

</td></tr>
<tr><td>

[resolvedValue](./IGridCellProps.resolvedValue.md)

</td><td>



</td><td>

[JsonValue](../../type-aliases/JsonValue.md)

</td><td>

The complete resolved resource value

</td></tr>
<tr><td>

[isEdited](./IGridCellProps.isEdited.md)

</td><td>



</td><td>

boolean

</td><td>

Whether this cell has been edited

</td></tr>
<tr><td>

[className](./IGridCellProps.className.md)

</td><td>



</td><td>

string

</td><td>

Additional CSS classes

</td></tr>
</tbody></table>
