[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IBoundTaskQueryFilter

# Interface: IBoundTaskQueryFilter

The narrowing filter of a bound view's query ([IBoundTaskQuery](IBoundTaskQuery.md), [IBoundTaskDueQuery](IBoundTaskDueQuery.md)).

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-lifecycleclass"></a> `lifecycleClass?` | `readonly` | [`TaskLifecycleClass`](../type-aliases/TaskLifecycleClass.md) |
| <a id="property-parentid"></a> `parentId?` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
| <a id="property-responsibility"></a> `responsibility?` | `readonly` | [`IResponsibility`](IResponsibility.md) |
| <a id="property-statuses"></a> `statuses?` | `readonly` | readonly [`TaskLifecycleStatus`](../type-aliases/TaskLifecycleStatus.md)[] |
