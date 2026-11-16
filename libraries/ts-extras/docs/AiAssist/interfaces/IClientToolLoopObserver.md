[Home](../../README.md) > [AiAssist](../README.md) > IClientToolLoopObserver

# Interface: IClientToolLoopObserver

Read-only hooks into a running loop. Both are synchronous. A hook that **throws** is isolated:
the throw is logged at `warn` through the turn's `logger` and does not change the outcome.
Neither is called after the loop has been stopped. A hook that aborts the caller's own `signal`
is not isolated from — that is a caller-driven stop, and the loop ends `'aborted'`.

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[round(round)](./IClientToolLoopObserver.round.md)

</td><td>



</td><td>

Called once per completed round, before the next round starts.

</td></tr>
<tr><td>

[event(round, event)](./IClientToolLoopObserver.event.md)

</td><td>



</td><td>

Called with every stream event of every round, as it arrives — for a streaming UI.

</td></tr>
</tbody></table>
