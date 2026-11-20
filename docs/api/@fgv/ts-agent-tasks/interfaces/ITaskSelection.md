[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskSelection

# Interface: ITaskSelection

What a query selects.

## Remarks

`scopes` is a **union**, never a fallback order, and an empty list matches nothing — there is
no implicit global access. `parentId` selects direct children only. `responsibility` narrows;
it confers no access. `statuses`, when present, must all belong to `lifecycleClass` (an
incompatible pair is refused, not answered with an empty page); an empty list matches nothing.

Ordinary selections enumerate **non-archived** tasks, terminal ones awaiting cleanup included.
An archived task is inspected directly by id, never enumerated.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-lifecycleclass"></a> `lifecycleClass` | `readonly` | [`TaskLifecycleClass`](../type-aliases/TaskLifecycleClass.md) |
| <a id="property-parentid"></a> `parentId?` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
| <a id="property-responsibility"></a> `responsibility?` | `readonly` | [`IResponsibility`](IResponsibility.md) |
| <a id="property-scopes"></a> `scopes` | `readonly` | readonly [`ITaskScope`](ITaskScope.md)[] |
| <a id="property-statuses"></a> `statuses?` | `readonly` | readonly [`TaskLifecycleStatus`](../type-aliases/TaskLifecycleStatus.md)[] |
