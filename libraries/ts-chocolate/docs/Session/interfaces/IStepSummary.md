[Home](../../README.md) > [Session](../README.md) > IStepSummary

# Interface: IStepSummary

Materialized summary of a procedure step's execution state.

Combines the static procedure step definition with its dynamic
execution status for UI consumption.

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

[stepIndex](./IStepSummary.stepIndex.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Index into the procedure's step array (0-based)

</td></tr>
<tr><td>

[step](./IStepSummary.step.md)

</td><td>

`readonly`

</td><td>

[IProcedureStepEntity](../../interfaces/IProcedureStepEntity.md)

</td><td>

The procedure step definition (task, timing, temperature)

</td></tr>
<tr><td>

[status](./IStepSummary.status.md)

</td><td>

`readonly`

</td><td>

[StepExecutionStatus](../../type-aliases/StepExecutionStatus.md)

</td><td>

Most recent execution status for this step

</td></tr>
<tr><td>

[isCurrent](./IStepSummary.isCurrent.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this is the currently active step

</td></tr>
<tr><td>

[executionCount](./IStepSummary.executionCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

How many times this step has been executed (including current)

</td></tr>
<tr><td>

[latestEntry](./IStepSummary.latestEntry.md)

</td><td>

`readonly`

</td><td>

[IStepExecutionEntry](../../interfaces/IStepExecutionEntry.md) | undefined

</td><td>

Most recent execution log entry for this step (if any)

</td></tr>
</tbody></table>
