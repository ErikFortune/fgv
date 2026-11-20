[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ISourceObservationReport

# Interface: ISourceObservationReport

One observation's outcome in a report.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-binding"></a> `binding` | `readonly` | [`ISourceBinding`](ISourceBinding.md) | - |
| <a id="property-message"></a> `message?` | `readonly` | `string` | - |
| <a id="property-outcome"></a> `outcome` | `readonly` | [`SourceObservationOutcome`](../type-aliases/SourceObservationOutcome.md) | - |
| <a id="property-revision"></a> `revision?` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) | The task revision after this observation, when a task was found. |
| <a id="property-taskid"></a> `taskId?` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) | - |
