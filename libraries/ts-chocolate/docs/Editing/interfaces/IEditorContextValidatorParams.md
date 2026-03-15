[Home](../../README.md) > [Editing](../README.md) > IEditorContextValidatorParams

# Interface: IEditorContextValidatorParams

Parameters for creating an editor context validator.

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

[context](./IEditorContextValidatorParams.context.md)

</td><td>

`readonly`

</td><td>

[EditorContext](../../classes/EditorContext.md)&lt;T, TBaseId, TId&gt;

</td><td>

The editor context to wrap with validation.

</td></tr>
<tr><td>

[entityConverter](./IEditorContextValidatorParams.entityConverter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;T&gt;

</td><td>

Converter for entity validation.

</td></tr>
<tr><td>

[keyConverter](./IEditorContextValidatorParams.keyConverter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;TBaseId&gt;

</td><td>

Converter for base ID validation.

</td></tr>
</tbody></table>
