[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskRecoveryOutcome

# Interface: ITaskRecoveryOutcome

What an explicit recovery of one task did.

## Remarks

`reattached`/`completed`/`unrecoverable` apply the source's projection (and may establish a new
source epoch as the baseline — the one place an incomparable revision is accepted).
`resumable` returns the source's reference for host approval and changes nothing. `unavailable`
and `unresolved` change nothing but observation health.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-observation"></a> `observation?` | `readonly` | [`ISourceObservationReport`](ISourceObservationReport.md) | - |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | - |
| <a id="property-result"></a> `result` | `readonly` | `"completed"` \| `"reattached"` \| `"resumable"` \| `"unrecoverable"` \| `"unavailable"` \| `"unresolved"` | - |
| <a id="property-resumable"></a> `resumable?` | `readonly` | RecoveryResult & \{ readonly state: "resumable"; \} | The source's reference, for `resumable`. |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) | - |
