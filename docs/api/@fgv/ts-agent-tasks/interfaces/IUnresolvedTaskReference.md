[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IUnresolvedTaskReference

# Interface: IUnresolvedTaskReference

A registered external task whose first usable observation has not arrived.

## Remarks

An unresolved reference has no lifecycle — none is invented for it. Its `revision` is the
catalog revision of the registration record (design §8.3), not a presentable task state, so
no consumer can acknowledge it: the renderer shows an unresolved reference only as a
diagnostic, never as a receipt entry, and never renders its `binding`.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-binding"></a> `binding` | `readonly` | [`ISourceBinding`](ISourceBinding.md) |
| <a id="property-detailversion"></a> `detailVersion` | `readonly` | `number` |
| <a id="property-id"></a> `id` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
| <a id="property-kind"></a> `kind` | `readonly` | [`TaskKind`](../type-aliases/TaskKind.md) |
| <a id="property-parentid"></a> `parentId?` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
| <a id="property-reason"></a> `reason` | `readonly` | `string` |
| <a id="property-responsibility"></a> `responsibility?` | `readonly` | [`IResponsibility`](IResponsibility.md) |
| <a id="property-revision"></a> `revision` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) |
| <a id="property-scopes"></a> `scopes` | `readonly` | readonly [`ITaskScope`](ITaskScope.md)[] |
| <a id="property-title"></a> `title` | `readonly` | `string` |
