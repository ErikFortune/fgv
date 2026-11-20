[Home](../../README.md) > [AiAssist](../README.md) > IAiToolEnablement

# Interface: IAiToolEnablement

Declares a tool as enabled/disabled in provider settings.
Tools are disabled by default — consuming apps must opt in explicitly.

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

[type](./IAiToolEnablement.type.md)

</td><td>

`readonly`

</td><td>

"web_search"

</td><td>

Which tool type.

</td></tr>
<tr><td>

[enabled](./IAiToolEnablement.enabled.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this tool is enabled by default for this provider.

</td></tr>
<tr><td>

[config](./IAiToolEnablement.config.md)

</td><td>

`readonly`

</td><td>

[IAiWebSearchToolConfig](../../interfaces/IAiWebSearchToolConfig.md)

</td><td>

Optional tool-specific configuration.

</td></tr>
</tbody></table>
