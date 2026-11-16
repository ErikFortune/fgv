[Home](../../README.md) > [AiAssist](../README.md) > IClientToolOrphanedCall

# Interface: IClientToolOrphanedCall

A tool call the round in flight at a stop had handed off for dispatch: the runner saw its
`client-tool-call-done` event. That round is discarded, so the host never receives this call in
a recorded round, whether or not it ran.

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

[toolName](./IClientToolOrphanedCall.toolName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The name of the tool the model called.

</td></tr>
<tr><td>

[callId](./IClientToolOrphanedCall.callId.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Provider-assigned call identifier (absent for Gemini).

</td></tr>
<tr><td>

[args](./IClientToolOrphanedCall.args.md)

</td><td>

`readonly`

</td><td>

JsonObject

</td><td>

The call's arguments as the model sent them.

</td></tr>
<tr><td>

[settled](./IClientToolOrphanedCall.settled.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the call's `client-tool-result` was seen before the stop.

</td></tr>
<tr><td>

[isError](./IClientToolOrphanedCall.isError.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

The seen result's `isError`; present only when `settled`.

</td></tr>
</tbody></table>
