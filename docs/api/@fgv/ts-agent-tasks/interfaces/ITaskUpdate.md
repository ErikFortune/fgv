[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskUpdate

# Interface: ITaskUpdate

One immutable update payload a task commit owes to an audience.

## Remarks

`snapshot` is the bounded presentation data *for this revision*, frozen when the update
was committed — never a reference to mutable current state, which is what lets a required
attention change or terminal outcome survive a later revision.

An update's identity is the tuple (`taskId`, `revision`, `category`): there is at most one
update per category per task revision, and the renderer rejects input that carries two.
`snapshot` must describe the same task and revision the update names.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-audience"></a> `audience` | `readonly` | readonly [`SubscriptionId`](../type-aliases/SubscriptionId.md)[] | - |
| <a id="property-category"></a> `category` | `readonly` | [`UpdateCategory`](../type-aliases/UpdateCategory.md) | - |
| <a id="property-coalesced"></a> `coalesced?` | `readonly` | `object` | Present on a routine update that superseded undelivered updates of its category (design § 9, coalescing): the earliest revision it replaced. Everything from there to this revision was not retained as its own update. |
| `coalesced.fromRevision` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) | - |
| <a id="property-id"></a> `id` | `readonly` | [`UpdateId`](../type-aliases/UpdateId.md) | - |
| <a id="property-required"></a> `required` | `readonly` | `boolean` | - |
| <a id="property-revision"></a> `revision` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) | - |
| <a id="property-snapshot"></a> `snapshot` | `readonly` | [`ITaskSummary`](ITaskSummary.md) | - |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) | - |
