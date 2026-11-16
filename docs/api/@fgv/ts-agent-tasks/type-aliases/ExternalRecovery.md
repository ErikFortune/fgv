[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ExternalRecovery

# Type Alias: ExternalRecovery\<TDetails\>

> **ExternalRecovery**\<`TDetails`\> = \{ `state`: `"reattached"` \| `"completed"`; `value`: [`ExternalProjection`](ExternalProjection.md)\<`TDetails`\>; \} \| \{ `reference`: [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md); `state`: `"resumable"`; \} \| \{ `reason`: `string`; `state`: `"unrecoverable"`; `value`: [`ExternalProjection`](ExternalProjection.md)\<`TDetails`\>; \} \| \{ `reason`: `string`; `state`: `"unavailable"` \| `"unresolved"`; \}

A typed recovery result.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tdetails"></a> `TDetails` |
