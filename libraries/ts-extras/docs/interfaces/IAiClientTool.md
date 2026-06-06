[Home](../README.md) > IAiClientTool

# Interface: IAiClientTool

A client-defined tool: configuration + execution callback pair.

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

[config](./IAiClientTool.config.md)

</td><td>

`readonly`

</td><td>

[IAiClientToolConfig](IAiClientToolConfig.md)&lt;TParams&gt;

</td><td>

The tool's configuration (name, description, parameters schema).

</td></tr>
<tr><td>

[execute](./IAiClientTool.execute.md)

</td><td>

`readonly`

</td><td>

(args: TParams) =&gt; Promise&lt;Result&lt;unknown&gt;&gt;

</td><td>

Execute the tool with validated parameters.

</td></tr>
</tbody></table>
