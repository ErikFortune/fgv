[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IPendingInventoryEntry

# Interface: IPendingInventoryEntry

A pending registration: the intent was accepted into the inventory, the record may or may
not have been written yet.

## Remarks

The creation operation's identity — its id, catalog operation, principal and canonical
request — and the first record's type are kept here only while the entry is pending: they are
what a resumed registration must match. They are cleared when the entry goes live, because the
accepted evidence is then in the record. The entry owns its capacity claims until then.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-capacityclaims"></a> `capacityClaims` | `readonly` | readonly [`ITaskCapacityClaim`](../type-aliases/ITaskCapacityClaim.md)[] | - |
| <a id="property-id"></a> `id` | `readonly` | `string` | - |
| <a id="property-operation"></a> `operation` | `readonly` | [`TaskCatalogOperationType`](../type-aliases/TaskCatalogOperationType.md) | The creation catalog operation, part of what a resumed registration must match. |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) | - |
| <a id="property-principalkey"></a> `principalKey` | `readonly` | `string` | The principal the registration was accepted for. |
| <a id="property-recordtype"></a> `recordType` | `readonly` | `"unresolved"` \| `"resolved"` | Whether the registration writes a resolved or an unresolved first record. |
| <a id="property-request"></a> `request` | `readonly` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | - |
| <a id="property-state"></a> `state` | `readonly` | `"pending"` | - |
