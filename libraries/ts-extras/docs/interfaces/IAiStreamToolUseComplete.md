[Home](../README.md) > IAiStreamToolUseComplete

# Interface: IAiStreamToolUseComplete

Emitted after a client-defined tool has been executed and the result is ready
to be fed back to the model in the round-trip continuation.

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

[type](./IAiStreamToolUseComplete.type.md)

</td><td>

`readonly`

</td><td>

"client-tool-result"

</td><td>



</td></tr>
<tr><td>

[toolName](./IAiStreamToolUseComplete.toolName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The name of the client tool that was executed.

</td></tr>
<tr><td>

[callId](./IAiStreamToolUseComplete.callId.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Provider-assigned call identifier.

</td></tr>
<tr><td>

[result](./IAiStreamToolUseComplete.result.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The stringified result returned by the tool's execute callback.

</td></tr>
<tr><td>

[isError](./IAiStreamToolUseComplete.isError.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the tool execution failed (schema validation failure, execute error, or unknown tool).

</td></tr>
</tbody></table>
