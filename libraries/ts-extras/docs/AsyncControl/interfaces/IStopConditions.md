[Home](../../README.md) > [AsyncControl](../README.md) > IStopConditions

# Interface: IStopConditions

The conditions under which `raceStopConditions` stops waiting for its work.

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

[deadlineMs](./IStopConditions.deadlineMs.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Stop when this many milliseconds have passed.

</td></tr>
<tr><td>

[signal](./IStopConditions.signal.md)

</td><td>

`readonly`

</td><td>

AbortSignal

</td><td>

Stop when this signal aborts.

</td></tr>
<tr><td>

[schedule](./IStopConditions.schedule.md)

</td><td>

`readonly`

</td><td>

[ScheduleTimer](../../type-aliases/ScheduleTimer.md)

</td><td>

Timer the deadline is armed through.

</td></tr>
</tbody></table>
