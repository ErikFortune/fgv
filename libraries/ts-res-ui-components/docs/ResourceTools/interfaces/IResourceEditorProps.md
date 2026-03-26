[Home](../../README.md) > [ResourceTools](../README.md) > IResourceEditorProps

# Interface: IResourceEditorProps

Props that will be passed to custom resource editors created by ResourceEditorFactory.
Custom editors should implement this interface to be compatible with ResolutionView.

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

[value](./IResourceEditorProps.value.md)

</td><td>



</td><td>

TV

</td><td>

The original JSON value to edit

</td></tr>
<tr><td>

[resourceId](./IResourceEditorProps.resourceId.md)

</td><td>



</td><td>

string

</td><td>

The resource ID for tracking edits

</td></tr>
<tr><td>

[isEdited](./IResourceEditorProps.isEdited.md)

</td><td>



</td><td>

boolean

</td><td>

Whether this resource has been edited

</td></tr>
<tr><td>

[editedValue](./IResourceEditorProps.editedValue.md)

</td><td>



</td><td>

TV

</td><td>

The current edited value if any

</td></tr>
<tr><td>

[onSave](./IResourceEditorProps.onSave.md)

</td><td>



</td><td>

(resourceId: string, editedValue: TV, originalValue: TV) =&gt; void

</td><td>

Callback when the user saves an edit

</td></tr>
<tr><td>

[onCancel](./IResourceEditorProps.onCancel.md)

</td><td>



</td><td>

(resourceId: string) =&gt; void

</td><td>

Callback when the user cancels an edit

</td></tr>
<tr><td>

[disabled](./IResourceEditorProps.disabled.md)

</td><td>



</td><td>

boolean

</td><td>

Whether editing is currently disabled

</td></tr>
<tr><td>

[className](./IResourceEditorProps.className.md)

</td><td>



</td><td>

string

</td><td>

Additional CSS classes

</td></tr>
</tbody></table>
