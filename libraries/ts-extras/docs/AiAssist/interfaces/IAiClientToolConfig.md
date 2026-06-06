[Home](../../README.md) > [AiAssist](../README.md) > IAiClientToolConfig

# Interface: IAiClientToolConfig

Configuration for a client-defined (harness-supplied) tool.

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

[type](./IAiClientToolConfig.type.md)

</td><td>

`readonly`

</td><td>

"client_tool"

</td><td>

Discriminator — always `'client_tool'`.

</td></tr>
<tr><td>

[name](./IAiClientToolConfig.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Tool name sent to the model (must be unique within a call).

</td></tr>
<tr><td>

[description](./IAiClientToolConfig.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable description of what the tool does, shown to the model.

</td></tr>
<tr><td>

[parametersSchema](./IAiClientToolConfig.parametersSchema.md)

</td><td>

`readonly`

</td><td>

ISchemaValidator&lt;TParams&gt;

</td><td>

JSON Schema validator for the tool's parameters.

</td></tr>
</tbody></table>
