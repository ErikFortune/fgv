[Home](../../README.md) > [ResolutionTools](../README.md) > IEditableJsonViewProps

# Interface: IEditableJsonViewProps

Props for the EditableJsonView component.

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

[value](./IEditableJsonViewProps.value.md)

</td><td>



</td><td>

[JsonValue](../../type-aliases/JsonValue.md)

</td><td>

The original JSON value

</td></tr>
<tr><td>

[resourceId](./IEditableJsonViewProps.resourceId.md)

</td><td>



</td><td>

string

</td><td>

The resource ID for tracking edits

</td></tr>
<tr><td>

[isEdited](./IEditableJsonViewProps.isEdited.md)

</td><td>



</td><td>

boolean

</td><td>

Whether this resource has been edited

</td></tr>
<tr><td>

[editedValue](./IEditableJsonViewProps.editedValue.md)

</td><td>



</td><td>

[JsonValue](../../type-aliases/JsonValue.md)

</td><td>

The current edited value if any

</td></tr>
<tr><td>

[onSave](./IEditableJsonViewProps.onSave.md)

</td><td>



</td><td>

(resourceId: string, editedValue: [JsonValue](../../type-aliases/JsonValue.md), originalValue: [JsonValue](../../type-aliases/JsonValue.md)) =&gt; void

</td><td>

Callback when the user saves an edit

</td></tr>
<tr><td>

[onCancel](./IEditableJsonViewProps.onCancel.md)

</td><td>



</td><td>

(resourceId: string) =&gt; void

</td><td>

Callback when the user cancels an edit

</td></tr>
<tr><td>

[disabled](./IEditableJsonViewProps.disabled.md)

</td><td>



</td><td>

boolean

</td><td>

Whether editing is currently disabled

</td></tr>
<tr><td>

[className](./IEditableJsonViewProps.className.md)

</td><td>



</td><td>

string

</td><td>

Additional CSS classes

</td></tr>
</tbody></table>
