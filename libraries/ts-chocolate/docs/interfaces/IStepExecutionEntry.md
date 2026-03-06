[Home](../README.md) > IStepExecutionEntry

# Interface: IStepExecutionEntry

A single entry in the append-only execution log.

Steps can be repeated (e.g. jump back to step 2 after completing step 4),
so the log may contain multiple entries for the same stepIndex. Entries
are never removed — the log always rolls forward.

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

[stepIndex](./IStepExecutionEntry.stepIndex.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Index into the procedure's step array (0-based)

</td></tr>
<tr><td>

[status](./IStepExecutionEntry.status.md)

</td><td>

`readonly`

</td><td>

[StepExecutionStatus](../type-aliases/StepExecutionStatus.md)

</td><td>

Current status of this execution entry

</td></tr>
<tr><td>

[startedAt](./IStepExecutionEntry.startedAt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

ISO 8601 timestamp when this step was started

</td></tr>
<tr><td>

[completedAt](./IStepExecutionEntry.completedAt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

ISO 8601 timestamp when this step was completed or skipped

</td></tr>
<tr><td>

[notes](./IStepExecutionEntry.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional notes recorded during execution

</td></tr>
</tbody></table>
