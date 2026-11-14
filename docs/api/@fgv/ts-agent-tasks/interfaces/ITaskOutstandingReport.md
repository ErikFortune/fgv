[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskOutstandingReport

# Interface: ITaskOutstandingReport

Every incomplete operation a repository is holding, at one moment — the running counterpart of the
report open produces.

## Remarks

Nothing here is an error. Each entry is preserved state awaiting a host action: a registration or
subscription accepted into the inventory whose record never landed (retry the same request), an
external command whose outcome is unknown (resolve it with the pump, or abandon it), a command
awaiting a feed revision, a task whose discharged payloads cleanup can prune, and each retained
subscription with what it is still owed. Each list is ordered and bounded by the request's limit;
`truncated` says whether any was cut short.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-awaitingcommands"></a> `awaitingCommands` | `readonly` | readonly [`TaskId`](../type-aliases/TaskId.md)[] |
| <a id="property-pendingregistrations"></a> `pendingRegistrations` | `readonly` | readonly `object`[] |
| <a id="property-pendingsubscriptions"></a> `pendingSubscriptions` | `readonly` | readonly `object`[] |
| <a id="property-prunable"></a> `prunable` | `readonly` | readonly [`TaskId`](../type-aliases/TaskId.md)[] |
| <a id="property-subscriptions"></a> `subscriptions` | `readonly` | readonly `object`[] |
| <a id="property-truncated"></a> `truncated` | `readonly` | `boolean` |
| <a id="property-unsettledcommands"></a> `unsettledCommands` | `readonly` | readonly [`TaskId`](../type-aliases/TaskId.md)[] |
