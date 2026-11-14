[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskCleanupReport

# Interface: ITaskCleanupReport

What one [TaskBroker.cleanup](../classes/TaskBroker.md#cleanup) pass did.

## Remarks

`pruned` tasks had discharged update payloads removed; `unchanged` candidates had nothing the
durable evidence would let go. Cleanup ends no obligation — pruning removes only payloads every
audience member already acknowledged or disposed.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-pruned"></a> `pruned` | `readonly` | readonly [`TaskId`](../type-aliases/TaskId.md)[] |
| <a id="property-unchanged"></a> `unchanged` | `readonly` | readonly [`TaskId`](../type-aliases/TaskId.md)[] |
