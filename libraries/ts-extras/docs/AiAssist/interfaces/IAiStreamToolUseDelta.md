[Home](../../README.md) > [AiAssist](../README.md) > IAiStreamToolUseDelta

# Interface: IAiStreamToolUseDelta

Emitted when a client-defined tool call is complete and its arguments are fully
accumulated. The `args` object is the fully parsed JSON object — no further
streaming deltas follow for this call.

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

[type](./IAiStreamToolUseDelta.type.md)

</td><td>

`readonly`

</td><td>

"client-tool-call-done"

</td><td>



</td></tr>
<tr><td>

[toolName](./IAiStreamToolUseDelta.toolName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The name of the client tool being called.

</td></tr>
<tr><td>

[callId](./IAiStreamToolUseDelta.callId.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Provider-assigned call identifier.

</td></tr>
<tr><td>

[args](./IAiStreamToolUseDelta.args.md)

</td><td>

`readonly`

</td><td>

JsonObject

</td><td>

The fully accumulated and parsed tool arguments.

</td></tr>
</tbody></table>
