[Home](../../README.md) > [Entities](../README.md) > IExecutionState

# Interface: IExecutionState

Session-level execution state for production tracking.

Present only when session status is 'active' or 'committing'.
Persists with the session entity for crash recovery. Execution
state is orthogonal to recipe editing undo/redo.

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

[currentStepIndex](./IExecutionState.currentStepIndex.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Index of the currently active procedure step (0-based)

</td></tr>
<tr><td>

[executionLog](./IExecutionState.executionLog.md)

</td><td>

`readonly`

</td><td>

readonly [IStepExecutionEntry](../../interfaces/IStepExecutionEntry.md)[]

</td><td>

Append-only log of step execution entries

</td></tr>
<tr><td>

[startedAt](./IExecutionState.startedAt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

ISO 8601 timestamp when production started

</td></tr>
</tbody></table>
