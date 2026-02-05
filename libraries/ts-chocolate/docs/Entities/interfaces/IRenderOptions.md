[Home](../../README.md) > [Entities](../README.md) > IRenderOptions

# Interface: IRenderOptions

Options for rendering procedure steps.

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

[onInvalidTaskRef](./IRenderOptions.onInvalidTaskRef.md)

</td><td>

`readonly`

</td><td>

[ValidationBehavior](../../type-aliases/ValidationBehavior.md)

</td><td>

How to handle steps with invalid task references

</td></tr>
<tr><td>

[onMissingVariables](./IRenderOptions.onMissingVariables.md)

</td><td>

`readonly`

</td><td>

[ValidationBehavior](../../type-aliases/ValidationBehavior.md)

</td><td>

How to handle missing variables during template rendering

</td></tr>
<tr><td>

[additionalContext](./IRenderOptions.additionalContext.md)

</td><td>

`readonly`

</td><td>

Record&lt;string, unknown&gt;

</td><td>

Additional context values available to all templates

</td></tr>
</tbody></table>
