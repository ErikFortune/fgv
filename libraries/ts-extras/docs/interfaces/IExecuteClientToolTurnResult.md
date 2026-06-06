[Home](../README.md) > IExecuteClientToolTurnResult

# Interface: IExecuteClientToolTurnResult

Return value of AiAssist.executeClientToolTurn.

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

[events](./IExecuteClientToolTurnResult.events.md)

</td><td>

`readonly`

</td><td>

AsyncIterable&lt;[IAiStreamEvent](../type-aliases/IAiStreamEvent.md)&gt;

</td><td>

The unified-event iterable.

</td></tr>
<tr><td>

[nextTurn](./IExecuteClientToolTurnResult.nextTurn.md)

</td><td>

`readonly`

</td><td>

Promise&lt;Result&lt;[IAiClientToolTurnResult](IAiClientToolTurnResult.md)&gt;&gt;

</td><td>

Resolves when the stream terminates.

</td></tr>
</tbody></table>
