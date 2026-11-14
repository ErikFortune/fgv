[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / ISystemOneMeta

# Interface: ISystemOneMeta

Per-call measurements. Nothing aggregates or acts on them.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-elapsedms"></a> `elapsedMs` | `readonly` | `number` | Client wall time, including the SDK's retries and back-off. |
| <a id="property-model"></a> `model` | `readonly` | `string` | The model that answered, from the response body. |
| <a id="property-requestid"></a> `requestId` | `readonly` | `string` \| `undefined` | From `x-typesafe-request-id`, or `undefined` when the server sends none. |
| <a id="property-timingheaders"></a> `timingHeaders?` | `readonly` | [`ISystemOneTimingHeaders`](ISystemOneTimingHeaders.md) | Omitted when the response carried neither timing header. |
| <a id="property-usage"></a> `usage` | `readonly` | [`ISystemOneUsage`](ISystemOneUsage.md) | Token usage, from the response body. |
