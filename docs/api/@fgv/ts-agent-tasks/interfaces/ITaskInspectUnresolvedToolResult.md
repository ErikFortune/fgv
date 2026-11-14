[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskInspectUnresolvedToolResult

# Interface: ITaskInspectUnresolvedToolResult

What `task_inspect` returns to the model for a registered task with no usable observation yet.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-context"></a> `context` | `readonly` | `string` |
| <a id="property-presentation"></a> `presentation` | `readonly` | [`TaskToolPresentation`](../type-aliases/TaskToolPresentation.md) |
| <a id="property-state"></a> `state` | `readonly` | `"unresolved"` |
