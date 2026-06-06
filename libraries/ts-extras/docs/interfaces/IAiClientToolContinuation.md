[Home](../README.md) > IAiClientToolContinuation

# Interface: IAiClientToolContinuation

The provider-specific continuation data needed to build the follow-up request
for the next round of the conversation.

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

[messages](./IAiClientToolContinuation.messages.md)

</td><td>

`readonly`

</td><td>

readonly JsonObject[]

</td><td>

Provider-native wire-format message objects to supply back on the next
streaming call via `IExecuteClientToolTurnParams.continuationMessages`
(which is forwarded as `rawTail` to the underlying call).

</td></tr>
<tr><td>

[toolCallsSummary](./IAiClientToolContinuation.toolCallsSummary.md)

</td><td>

`readonly`

</td><td>

readonly [IAiClientToolCallSummary](IAiClientToolCallSummary.md)[]

</td><td>

Summary of each tool call that was executed in this turn.

</td></tr>
</tbody></table>
