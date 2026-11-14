[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskPendingRegistration

# Interface: ITaskPendingRegistration

A pending task registration as [ITaskRepository.pendingRegistration](ITaskRepository.md#pendingregistration) answers it: everything a
retry of it must repeat. Its capacity claims stay with the repository.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-landedscopes"></a> `landedScopes?` | `readonly` | readonly [`ITaskScope`](ITaskScope.md)[] | When the registration's first record already landed — its write succeeded and marking it live did not — the scopes that record carries. A resume commits that record as it is, so these are the scopes it must be authorized for. |
| <a id="property-operation"></a> `operation` | `readonly` | [`TaskCatalogOperationType`](../type-aliases/TaskCatalogOperationType.md) | - |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) | - |
| <a id="property-principalkey"></a> `principalKey` | `readonly` | `string` | The principal the registration was accepted for. |
| <a id="property-recordtype"></a> `recordType` | `readonly` | `"unresolved"` \| `"resolved"` | - |
| <a id="property-request"></a> `request` | `readonly` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | The canonical creation request the registration was accepted with. |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) | - |
