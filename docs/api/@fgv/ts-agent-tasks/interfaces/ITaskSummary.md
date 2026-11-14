[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskSummary

# Interface: ITaskSummary

The presentable part of a task: its envelope, without kind-specific details.

## Remarks

Details are never implicitly model-visible, so a summary carries none. A validated
[ITaskSnapshot](ITaskSnapshot.md) satisfies this shape structurally; where the context renderer
accepts one, it discards `details` explicitly at the boundary rather than rendering it.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-envelope"></a> `envelope` | `readonly` | [`ITaskEnvelope`](ITaskEnvelope.md) |
