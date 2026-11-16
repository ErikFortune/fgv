[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskContextDiagnostic

# Interface: ITaskContextDiagnostic

One unresolved reference as rendered: exactly the fields the text shows, and no more.

## Remarks

Deliberately not an [IUnresolvedTaskReference](IUnresolvedTaskReference.md): that carries the source binding and
the registration record's revision, neither of which is ever presented. The structured view
discloses no more than the text does.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-depth"></a> `depth` | `readonly` | `number` |
| <a id="property-id"></a> `id` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
| <a id="property-kind"></a> `kind` | `readonly` | [`TaskKind`](../type-aliases/TaskKind.md) |
| <a id="property-reason"></a> `reason` | `readonly` | `string` |
| <a id="property-title"></a> `title` | `readonly` | `string` |
