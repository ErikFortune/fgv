[Home](../../README.md) > [AsyncControl](../README.md) > WriteGate

# Class: WriteGate

A cooperative gate for writes: one switch that every write routed through it consults, so a
host can stop them all, or hold them still for a moment, without a close per store.

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

[inFlight](./WriteGate.inFlight.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

How many guarded writes are under way.

</td></tr>
<tr><td>

[waiting](./WriteGate.waiting.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

How many guarded writes are waiting for a pause to end.

</td></tr>
<tr><td>

[quiet](./WriteGate.quiet.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether no guarded write is under way.

</td></tr>
</tbody></table>

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

[create(options)](./WriteGate.create.md)

</td><td>

`static`

</td><td>

Creates an open gate.

</td></tr>
<tr><td>

[check()](./WriteGate.check.md)

</td><td>



</td><td>

Succeeds while the gate is lowered; fails with the reason while it is raised.

</td></tr>
<tr><td>

[raise(reason)](./WriteGate.raise.md)

</td><td>



</td><td>

Raises the gate: every write guarded from now on is refused without running, and every write
waiting on a pause is woken and refused.

</td></tr>
<tr><td>

[lower()](./WriteGate.lower.md)

</td><td>



</td><td>

Lowers the gate.

</td></tr>
<tr><td>

[guard(write)](./WriteGate.guard.md)

</td><td>



</td><td>

Runs `write` through the gate: refused while it is raised, held while it is paused, and

</td></tr>
<tr><td>

[guardDetailed(write)](./WriteGate.guardDetailed.md)

</td><td>



</td><td>

`guard` for a write that answers a detailed result.

</td></tr>
<tr><td>

[pause(timeoutMs)](./WriteGate.pause.md)

</td><td>



</td><td>

Holds every write that has not started, and waits — for at most `timeoutMs` — for the writes

</td></tr>
</tbody></table>
