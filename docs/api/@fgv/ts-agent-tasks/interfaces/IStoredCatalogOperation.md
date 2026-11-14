[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IStoredCatalogOperation

# Interface: IStoredCatalogOperation

Stored evidence of one catalog operation.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-operation"></a> `operation` | `readonly` | [`TaskCatalogOperationType`](../type-aliases/TaskCatalogOperationType.md) |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-principalkey"></a> `principalKey` | `readonly` | `string` |
| <a id="property-receipt"></a> `receipt` | `readonly` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) |
| <a id="property-request"></a> `request` | `readonly` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) |
| <a id="property-type"></a> `type` | `readonly` | `"catalog"` |
