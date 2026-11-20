[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskAction

# Type Alias: TaskAction

> **TaskAction** = `"read"` \| `"create"` \| `"update-tracked"` \| `"command"` \| `"reassign"` \| `"change-scopes"` \| `"reparent"` \| `"subscribe"` \| `"acknowledge"` \| `"stop"` \| `"release-stop"` \| `"complete-list"` \| `"dispose-obligation"` \| `"archive"`

Everything a bound principal can ask to do, each checked separately.

## Remarks

Scopes, hierarchy, responsibility, source binding and command receipts grant none of these.

`acknowledge` and `dispose-obligation` are asked in two forms. Naming a task, they ask about that
task. Naming **no task**, carrying only a subscription's selection `scopes`, they ask whether the
principal may acknowledge, or dispose of obligations, **for any task in those scopes** —
`IBoundTaskDelivery.disposeWithheld` asks this for both actions, and `closeSubscription` for
`dispose-obligation`. See [ITaskAccessRequest](../interfaces/ITaskAccessRequest.md).
