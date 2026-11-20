[Home](../../README.md) > [AiAssist](../README.md) > IClientToolRound

# Interface: IClientToolRound

One completed round of a `runClientToolLoop` loop.

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

[round](./IClientToolRound.round.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

1-based round number.

</td></tr>
<tr><td>

[fullText](./IClientToolRound.fullText.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The round's full model text (may be empty).

</td></tr>
<tr><td>

[truncated](./IClientToolRound.truncated.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

The provider's own truncation report for this round.

</td></tr>
<tr><td>

[calls](./IClientToolRound.calls.md)

</td><td>

`readonly`

</td><td>

readonly [IAiClientToolCallSummary](../../interfaces/IAiClientToolCallSummary.md)[]

</td><td>

The tool calls made this round, each with its `durationMs` (empty on a completing round).

</td></tr>
<tr><td>

[providerDurationMs](./IClientToolRound.providerDurationMs.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The round's elapsed time on the loop's clock minus the sum of its calls' `durationMs`, floored
at zero.

</td></tr>
<tr><td>

[usage](./IClientToolRound.usage.md)

</td><td>

`readonly`

</td><td>

[IAiCompletionUsage](../../interfaces/IAiCompletionUsage.md)

</td><td>

The round's token usage, when the provider reported it.

</td></tr>
<tr><td>

[toolConflicts](./IClientToolRound.toolConflicts.md)

</td><td>

`readonly`

</td><td>

[IAiToolConflictReport](../../interfaces/IAiToolConflictReport.md)

</td><td>

What tool-conflict resolution did to this round's tools.

</td></tr>
</tbody></table>
