[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskToolBudget

# Interface: ITaskToolBudget

Bounds on what one task tool call returns to a model.

## Remarks

`context` bounds every task presentation: tasks reach the model only as rendered context text,
and `context.maxItems` is also the largest page a query may ask for. `maxDetailsChars` bounds the
serialized, escaped JSON text of a task's details (`serializeTaskData`), counted in UTF-16 code units; details over it are omitted and the
omission is reported.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-context"></a> `context` | `readonly` | [`ITaskContextBudget`](ITaskContextBudget.md) |
| <a id="property-maxdetailschars"></a> `maxDetailsChars` | `readonly` | `number` |
