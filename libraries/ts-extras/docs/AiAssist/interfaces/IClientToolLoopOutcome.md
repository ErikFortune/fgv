[Home](../../README.md) > [AiAssist](../README.md) > IClientToolLoopOutcome

# Interface: IClientToolLoopOutcome

The outcome of a `runClientToolLoop` loop that did not fail.

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

[state](./IClientToolLoopOutcome.state.md)

</td><td>

`readonly`

</td><td>

[ClientToolLoopState](../../type-aliases/ClientToolLoopState.md)

</td><td>

How the loop ended.

</td></tr>
<tr><td>

[rounds](./IClientToolLoopOutcome.rounds.md)

</td><td>

`readonly`

</td><td>

readonly [IClientToolRound](../../interfaces/IClientToolRound.md)[]

</td><td>

Every round that completed, in order.

</td></tr>
<tr><td>

[continuationMessages](./IClientToolLoopOutcome.continuationMessages.md)

</td><td>

`readonly`

</td><td>

readonly JsonObject[]

</td><td>

The most recent **cumulative** continuation tail, absent when no completed round produced one.

</td></tr>
<tr><td>

[orphanedRoundCalls](./IClientToolLoopOutcome.orphanedRoundCalls.md)

</td><td>

`readonly`

</td><td>

readonly [IClientToolOrphanedCall](../../interfaces/IClientToolOrphanedCall.md)[]

</td><td>

Present after `'aborted'` and `'deadline'` only: every call the round in flight at the stop had
handed off for dispatch, in order, settled or not.

</td></tr>
</tbody></table>
