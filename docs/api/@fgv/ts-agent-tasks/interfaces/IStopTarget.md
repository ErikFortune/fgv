[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IStopTarget

# Interface: IStopTarget

One target of a cascade stop: its current attempt, the stable command key of that attempt, and
where it stands.

## Remarks

`operationId` is minted when the attempt is persisted — before anything is dispatched — and a
restart finds the attempt's effect in the target's own record under that key. A definitely
rejected attempt (a source revision conflict) is superseded by a new persisted attempt with a
fresh key; an uncertain one keeps its key until its outcome is resolved. Earlier attempts remain
in the target's operation evidence.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-attempt"></a> `attempt` | `readonly` | `number` |
| <a id="property-confirmedrevision"></a> `confirmedRevision?` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-stablesourceevidence"></a> `stableSourceEvidence?` | `readonly` | [`IStableStopEvidence`](IStableStopEvidence.md) |
| <a id="property-state"></a> `state` | `readonly` | [`StopTargetState`](../type-aliases/StopTargetState.md) |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
| <a id="property-violation"></a> `violation?` | `readonly` | [`IStopViolation`](IStopViolation.md) |
