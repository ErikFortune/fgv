[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IIdentityConverters

# Interface: IIdentityConverters

The branded identity converters, all sharing one bounded safe syntax.

## Remarks

Every one of these is a bounded identifier rather than free text, because these
values reach record filenames and index keys. None of them may be a caller-supplied
path fragment.

`PageCursor` deliberately has no converter here: a keyset cursor's encoding is
decided by the slice that issues one, and this slice cannot exercise that choice.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-capacityclaimid"></a> `capacityClaimId` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CapacityClaimId`](../type-aliases/CapacityClaimId.md)\> |
| <a id="property-consumerid"></a> `consumerId` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ConsumerId`](../type-aliases/ConsumerId.md)\> |
| <a id="property-deliveryid"></a> `deliveryId` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`DeliveryId`](../type-aliases/DeliveryId.md)\> |
| <a id="property-identifier"></a> `identifier` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\> |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`OperationId`](../type-aliases/OperationId.md)\> |
| <a id="property-sourceid"></a> `sourceId` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\> |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SubscriptionId`](../type-aliases/SubscriptionId.md)\> |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TaskId`](../type-aliases/TaskId.md)\> |
| <a id="property-taskkind"></a> `taskKind` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TaskKind`](../type-aliases/TaskKind.md)\> |
| <a id="property-updateid"></a> `updateId` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`UpdateId`](../type-aliases/UpdateId.md)\> |
