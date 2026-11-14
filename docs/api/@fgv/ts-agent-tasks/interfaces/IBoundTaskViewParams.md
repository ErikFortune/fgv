[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IBoundTaskViewParams

# Interface: IBoundTaskViewParams

What a host binds a view or writer to.

## Remarks

Host-side only: nothing here reaches a request. `principal` is the identity stored with every
operation the binding performs and is part of each operation's dedup identity. `scopes` are the
view's maximum selectors — a task outside them is invisible whatever the policy says, and a task
inside them still needs the policy's `read`. `creationScopes` (default: `scopes`) are what a
bound creation labels its task with, and must lie within `scopes`. `projector` defaults to
[defaultTaskProjector](../variables/defaultTaskProjector.md).

## Extended by

- [`IBoundTaskDeliveryParams`](IBoundTaskDeliveryParams.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-authorization"></a> `authorization` | `readonly` | [`ITaskAuthorization`](ITaskAuthorization.md) |
| <a id="property-creationscopes"></a> `creationScopes?` | `readonly` | readonly [`ITaskScope`](ITaskScope.md)[] |
| <a id="property-principal"></a> `principal` | `readonly` | `string` |
| <a id="property-projector"></a> `projector?` | `readonly` | [`ITaskProjector`](ITaskProjector.md) |
| <a id="property-scopes"></a> `scopes` | `readonly` | readonly [`ITaskScope`](ITaskScope.md)[] |
