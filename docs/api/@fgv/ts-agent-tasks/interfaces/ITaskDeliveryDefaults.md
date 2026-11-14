[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskDeliveryDefaults

# Interface: ITaskDeliveryDefaults

The broker's delivery defaults: what a new subscription gets for anything its request leaves out,
and how long an issued receipt lives. Persisted policies are never reread from these.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-maxbaselinetasks"></a> `maxBaselineTasks?` | `readonly` | `number` | The most tasks a `current` subscription's baseline may hold. A selection matching more is refused with `backpressure`, never given a partial baseline that claims to be complete. Default 200. |
| <a id="property-policy"></a> `policy?` | `readonly` | `Partial`\<`Omit`\<[`ITaskDeliveryPolicy`](ITaskDeliveryPolicy.md), `"schemaVersion"`\>\> | - |
| <a id="property-receiptlifetimems"></a> `receiptLifetimeMs?` | `readonly` | `number` | Issued-receipt lifetime in milliseconds. Default 24 hours. |
