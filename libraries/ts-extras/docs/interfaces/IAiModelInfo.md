[Home](../README.md) > IAiModelInfo

# Interface: IAiModelInfo

Information about a single model returned by a provider's list endpoint,
with capabilities already resolved (native + config rules).

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

[id](./IAiModelInfo.id.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Provider-native model identifier.

</td></tr>
<tr><td>

[capabilities](./IAiModelInfo.capabilities.md)

</td><td>

`readonly`

</td><td>

ReadonlySet&lt;[AiModelCapability](../type-aliases/AiModelCapability.md)&gt;

</td><td>

Resolved capability set — union of native declarations and config rules.

</td></tr>
<tr><td>

[displayName](./IAiModelInfo.displayName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Friendly name for display, when known.

</td></tr>
</tbody></table>
