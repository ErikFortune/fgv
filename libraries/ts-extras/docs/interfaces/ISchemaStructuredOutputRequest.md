[Home](../README.md) > ISchemaStructuredOutputRequest

# Interface: ISchemaStructuredOutputRequest

Ask the provider for JSON constrained to a schema.

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

[mode](./ISchemaStructuredOutputRequest.mode.md)

</td><td>

`readonly`

</td><td>

"schema"

</td><td>



</td></tr>
<tr><td>

[schema](./ISchemaStructuredOutputRequest.schema.md)

</td><td>

`readonly`

</td><td>

ISchemaValidator&lt;unknown&gt;

</td><td>

The schema to constrain generation to — **the same object you validate the

</td></tr>
<tr><td>

[onUnsupported](./ISchemaStructuredOutputRequest.onUnsupported.md)

</td><td>

`readonly`

</td><td>

[StructuredOutputFallback](../type-aliases/StructuredOutputFallback.md)

</td><td>



</td></tr>
<tr><td>

[adaptOptionalToNullable](./ISchemaStructuredOutputRequest.adaptOptionalToNullable.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

On a format that requires every property to be `required`, send an optional

</td></tr>
</tbody></table>
