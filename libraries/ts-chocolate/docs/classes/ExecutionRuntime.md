[Home](../README.md) > ExecutionRuntime

# Class: ExecutionRuntime

Materializes execution state by combining persisted data with procedure
step definitions to derive production-relevant properties.

This class is intentionally lightweight and stateless — it reads from
a persisted IExecutionState and procedure steps, deriving all
computed properties on access. Mutations produce a new
IExecutionState rather than mutating in place.

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

[state](./ExecutionRuntime.state.md)

</td><td>

`readonly`

</td><td>

[IExecutionState](../interfaces/IExecutionState.md)

</td><td>

The underlying persisted execution state.

</td></tr>
<tr><td>

[currentStepIndex](./ExecutionRuntime.currentStepIndex.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Index of the currently active step (0-based).

</td></tr>
<tr><td>

[totalSteps](./ExecutionRuntime.totalSteps.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Total number of procedure steps.

</td></tr>
<tr><td>

[isComplete](./ExecutionRuntime.isComplete.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether all steps have been completed or skipped.

</td></tr>
<tr><td>

[currentStep](./ExecutionRuntime.currentStep.md)

</td><td>

`readonly`

</td><td>

[IProcedureStepEntity](../interfaces/IProcedureStepEntity.md) | undefined

</td><td>

The current procedure step definition, or undefined if complete.

</td></tr>
<tr><td>

[startedAt](./ExecutionRuntime.startedAt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

ISO 8601 timestamp when production started.

</td></tr>
<tr><td>

[completedStepCount](./ExecutionRuntime.completedStepCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Returns the number of completed steps (unique step indices that have

</td></tr>
<tr><td>

[progressLabel](./ExecutionRuntime.progressLabel.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Returns a progress string like "3/7".

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

[from(state, steps)](./ExecutionRuntime.from.md)

</td><td>

`static`

</td><td>

Creates an ExecutionRuntime from persisted state and procedure steps.

</td></tr>
<tr><td>

[initialize(steps)](./ExecutionRuntime.initialize.md)

</td><td>

`static`

</td><td>

Creates initial execution state for a procedure with the given steps.

</td></tr>
<tr><td>

[getStepSummaries()](./ExecutionRuntime.getStepSummaries.md)

</td><td>



</td><td>

Returns a summary for each procedure step, combining the step definition

</td></tr>
<tr><td>

[advanceStep()](./ExecutionRuntime.advanceStep.md)

</td><td>



</td><td>

Marks the current step as completed and advances to the next step.

</td></tr>
<tr><td>

[skipStep()](./ExecutionRuntime.skipStep.md)

</td><td>



</td><td>

Marks the current step as skipped and advances to the next step.

</td></tr>
<tr><td>

[jumpToStep(stepIndex)](./ExecutionRuntime.jumpToStep.md)

</td><td>



</td><td>

Jumps to a specific step, appending a new active entry.

</td></tr>
<tr><td>

[addStepNotes(notes)](./ExecutionRuntime.addStepNotes.md)

</td><td>



</td><td>

Adds a note to the current step's active log entry.

</td></tr>
</tbody></table>
