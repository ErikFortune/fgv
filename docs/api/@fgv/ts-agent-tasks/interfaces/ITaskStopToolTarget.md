[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskStopToolTarget

# Interface: ITaskStopToolTarget

One target of a stop as `task_stop` and `task_stop_inspect` show it to the model: the task, where it
stands, and — when present — the revision its stopped state was confirmed at and a violation of a
stable stop.

## Remarks

A target's attempt number and command key are not shown. The model never supplies an operation id,
so a command key is of no use to it, and the attempt counts the host's retries against a source.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-confirmedrevision"></a> `confirmedRevision?` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) |
| <a id="property-state"></a> `state` | `readonly` | [`StopTargetState`](../type-aliases/StopTargetState.md) |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
| <a id="property-violation"></a> `violation?` | `readonly` | [`IStopViolation`](IStopViolation.md) |
