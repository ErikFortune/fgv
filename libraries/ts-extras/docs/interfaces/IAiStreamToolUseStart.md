[Home](../README.md) > IAiStreamToolUseStart

# Interface: IAiStreamToolUseStart

Emitted when a client-defined tool call begins streaming. Carries the tool name
and optional provider-assigned call ID (Anthropic / OpenAI Responses API; absent
for Gemini which does not assign call IDs).

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

[type](./IAiStreamToolUseStart.type.md)

</td><td>

`readonly`

</td><td>

"client-tool-call-start"

</td><td>



</td></tr>
<tr><td>

[toolName](./IAiStreamToolUseStart.toolName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The name of the client tool being called.

</td></tr>
<tr><td>

[callId](./IAiStreamToolUseStart.callId.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Provider-assigned call identifier (Anthropic: `toolu_*`; OpenAI: `call_*`).

</td></tr>
</tbody></table>
