[Home](../README.md) > IJsonEditorValidationOptions

# Interface: IJsonEditorValidationOptions

Validation options for a JsonEditor | JsonEditor.

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

[onInvalidPropertyName](./IJsonEditorValidationOptions.onInvalidPropertyName.md)

</td><td>



</td><td>

"error" | "ignore"

</td><td>

If `onInvalidPropertyName` is `'error'` (default) then any property name
that is invalid after template rendering causes an error and stops
conversion.

</td></tr>
<tr><td>

[onInvalidPropertyValue](./IJsonEditorValidationOptions.onInvalidPropertyValue.md)

</td><td>



</td><td>

"error" | "ignore"

</td><td>

If `onInvalidPropertyValue` is `'error'` (default) then any illegal
property value other than `undefined` causes an error and stops
conversion.

</td></tr>
<tr><td>

[onUndefinedPropertyValue](./IJsonEditorValidationOptions.onUndefinedPropertyValue.md)

</td><td>



</td><td>

"error" | "ignore"

</td><td>

If `onUndefinedPropertyValue` is `'error'`, then any property with
value `undefined` will cause an error and stop conversion.

</td></tr>
</tbody></table>
