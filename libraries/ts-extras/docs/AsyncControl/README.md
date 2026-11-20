[Home](../README.md) > AsyncControl

# Namespace: AsyncControl

Control for asynchronous work: stop conditions — a deadline and a caller signal, raced against the
work so that work which ignores its signal still cannot hold its caller — and a write gate that
stops or holds every write routed through it.

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[WriteGate](./classes/WriteGate.md)

</td><td>

A cooperative gate for writes: one switch that every write routed through it consults, so a

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IStopConditions](./interfaces/IStopConditions.md)

</td><td>

The conditions under which `raceStopConditions` stops waiting for its work.

</td></tr>
<tr><td>

[IWriteGateOptions](./interfaces/IWriteGateOptions.md)

</td><td>

Options for `WriteGate.create`.

</td></tr>
<tr><td>

[IWriteGatePause](./interfaces/IWriteGatePause.md)

</td><td>

A pause held on a `WriteGate`.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[CancelTimer](./type-aliases/CancelTimer.md)

</td><td>

Cancels a timer started by a `ScheduleTimer`.

</td></tr>
<tr><td>

[ScheduleTimer](./type-aliases/ScheduleTimer.md)

</td><td>

Starts a one-shot timer that calls `fn` after `ms` milliseconds and returns its cancel function:

</td></tr>
<tr><td>

[StopDetail](./type-aliases/StopDetail.md)

</td><td>

Why a `raceStopConditions` race ended without the work's own success:
- `'aborted'` — the caller's signal aborted, before or while the work ran.

</td></tr>
<tr><td>

[StopReason](./type-aliases/StopReason.md)

</td><td>

The two `StopDetail` values that mean a stop condition fired, rather than the work failing.

</td></tr>
<tr><td>

[WriteGatePauseFailure](./type-aliases/WriteGatePauseFailure.md)

</td><td>

Why a `WriteGate.pause` failed, leaving nothing paused:
- `'timeout'` — writes under way did not finish in time, and none was waiting on the pause.

</td></tr>
<tr><td>

[WriteGateRefusal](./type-aliases/WriteGateRefusal.md)

</td><td>

Why a guarded write's outcome came from the gate rather than from the write:
- `'raised'` — the gate was raised, when the write asked or while it waited on a pause.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[raceStopConditions](./functions/raceStopConditions.md)

</td><td>

Runs `work` under an optional deadline and an optional caller signal, and settles with whichever

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[MAX_DEADLINE_MS](./variables/MAX_DEADLINE_MS.md)

</td><td>

The largest delay a platform timer honours.

</td></tr>
</tbody></table>
