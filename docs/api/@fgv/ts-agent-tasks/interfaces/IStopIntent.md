[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IStopIntent

# Interface: IStopIntent

A persisted cascade stop, held in its root's record.

## Remarks

`targets` is the complete authoritative subtree captured under the writer at acceptance — root
first, then breadth-first with task-id tie breaks — never a filtered or truncated tree. The intent
is coordination state beside the root's envelope, not part of it: public lifecycle keeps describing
the root's own execution. `requestedBy` is provenance, never a retained authorization grant — every
pump pass re-resolves current authority.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-mode"></a> `mode` | `readonly` | [`StopMode`](../type-aliases/StopMode.md) |
| <a id="property-requestedby"></a> `requestedBy` | `readonly` | `string` |
| <a id="property-rootid"></a> `rootId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
| <a id="property-state"></a> `state` | `readonly` | [`StopIntentState`](../type-aliases/StopIntentState.md) |
| <a id="property-targets"></a> `targets` | `readonly` | readonly [`IStopTarget`](IStopTarget.md)[] |
| <a id="property-topologygeneration"></a> `topologyGeneration` | `readonly` | `number` |
