[Home](../README.md) > IAiClientToolTurnResult

# Interface: IAiClientToolTurnResult

The result of a single client-tool turn: the optional continuation for the next
call (absent when no tool calls occurred) and whether the stream was truncated.

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

[continuation](./IAiClientToolTurnResult.continuation.md)

</td><td>

`readonly`

</td><td>

[IAiClientToolContinuation](IAiClientToolContinuation.md) | undefined

</td><td>

The continuation data for the next round-trip.

</td></tr>
<tr><td>

[truncated](./IAiClientToolTurnResult.truncated.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the stream was truncated (token limit or stop reason).

</td></tr>
<tr><td>

[fullText](./IAiClientToolTurnResult.fullText.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The full concatenated text from all `text-delta` events in this turn.

</td></tr>
</tbody></table>
