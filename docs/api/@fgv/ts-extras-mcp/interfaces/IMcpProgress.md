[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / IMcpProgress

# Interface: IMcpProgress

A progress notification from the server for an in-flight request.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-message"></a> `message?` | `readonly` | `string` | A human-readable progress message, when the server sent one. |
| <a id="property-progress"></a> `progress` | `readonly` | `number` | Progress so far. Increases with each notification. |
| <a id="property-total"></a> `total?` | `readonly` | `number` | The total, when the server knows it. |
