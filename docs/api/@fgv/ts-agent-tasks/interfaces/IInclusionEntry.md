[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IInclusionEntry

# Interface: IInclusionEntry

One task revision a rendered context actually included.

## Remarks

`updateIds` names only the updates whose *complete* bounded payload was rendered. An item
shown in abbreviated form keeps its revision here and carries no update IDs: an abbreviated
presentation is not delivery of what it abbreviated.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-revision"></a> `revision` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
| <a id="property-updateids"></a> `updateIds` | `readonly` | readonly [`UpdateId`](../type-aliases/UpdateId.md)[] |
