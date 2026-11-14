[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskAccessRequest

# Interface: ITaskAccessRequest

One question put to a host's authorization policy.

## Remarks

`task` is the envelope-only summary — never details — so a policy decides from the same
resident data a warm query holds. An unresolved registration is described by its `reference`
instead. A `create` subject has neither: `scopes` and `targetResponsibility` describe the task
it would be. A `change-scopes` request carries its subject **and** `scopes`: the complete scope
set the task will carry once the change commits. A `subscribe` request, and a `dispose-obligation`
over a whole subscription, carry the subscription's selection scopes. `targetResponsibility` is
`'unassigned'` for an explicit unassignment.

**A missing `task` is never a grant.** An `acknowledge` or `dispose-obligation` request with no
`task` and no `reference`, only `scopes`, asks the broadest question — may this principal
acknowledge, or dispose, for **any** task in those scopes — and is what lets a delivery end
obligations for tasks it can no longer be shown (`disposeWithheld`) or close a subscription with
its obligations (`closeSubscription`). A policy must answer it on the scopes alone, and must not
read the absent task as "nothing to check". A policy that grants it at the scope level but denies
particular tasks still lets that binding end those tasks' obligations unseen.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `readonly` | [`TaskAction`](../type-aliases/TaskAction.md) |
| <a id="property-command"></a> `command?` | `readonly` | `string` |
| <a id="property-reference"></a> `reference?` | `readonly` | [`IUnresolvedTaskReference`](IUnresolvedTaskReference.md) |
| <a id="property-role"></a> `role` | `readonly` | [`TaskAccessRole`](../type-aliases/TaskAccessRole.md) |
| <a id="property-scopes"></a> `scopes?` | `readonly` | readonly [`ITaskScope`](ITaskScope.md)[] |
| <a id="property-targetresponsibility"></a> `targetResponsibility?` | `readonly` | [`IResponsibility`](IResponsibility.md) \| `"unassigned"` |
| <a id="property-task"></a> `task?` | `readonly` | [`ITaskSummary`](ITaskSummary.md) |
