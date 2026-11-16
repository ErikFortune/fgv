[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IDeliveryConverters

# Interface: IDeliveryConverters

Converters for subscriptions, their records and delivery requests (T7).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-abandoncommandrequest"></a> `abandonCommandRequest` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAbandonCommandRequest`](IAbandonCommandRequest.md)\> | - |
| <a id="property-categories"></a> `categories` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`UpdateCategory`](../type-aliases/UpdateCategory.md)[]\> | Categories strictly ascending, each once, including every mandatory one. |
| <a id="property-closerequest"></a> `closeRequest` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICloseSubscriptionRequest`](ICloseSubscriptionRequest.md)\> | - |
| <a id="property-consumerinventory"></a> `consumerInventory` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`ITaskConsumerInventoryEntry`](../type-aliases/ITaskConsumerInventoryEntry.md)[]\> | - |
| <a id="property-consumerinventoryentry"></a> `consumerInventoryEntry` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskConsumerInventoryEntry`](../type-aliases/ITaskConsumerInventoryEntry.md)\> | - |
| <a id="property-consumerrecord"></a> `consumerRecord` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskConsumerRecord`](ITaskConsumerRecord.md)\> | A consumer record, with every invariant a record this release writes must keep. |
| <a id="property-disposerequest"></a> `disposeRequest` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IDisposeObligationsRequest`](IDisposeObligationsRequest.md)\> | - |
| <a id="property-disposewithheldrequest"></a> `disposeWithheldRequest` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IDisposeWithheldRequest`](IDisposeWithheldRequest.md)\> | A request to end a bound delivery's withheld obligations. |
| <a id="property-disposition"></a> `disposition` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskObligationDisposition`](ITaskObligationDisposition.md)\> | One disposition entry of a consumer record. |
| <a id="property-dispositionreason"></a> `dispositionReason` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\> | A disposition reason: one non-empty line. Its byte bound is the stored profile's, checked by storage. |
| <a id="property-drainchange"></a> `drainChange` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskSubscriptionDrainChange`](ITaskSubscriptionDrainChange.md)\> | - |
| <a id="property-drainprincipals"></a> `drainPrincipals` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `string`[]\> | A stored drain-principal list: non-empty, bounded, unique and ascending. |
| <a id="property-drainprincipalsrequest"></a> `drainPrincipalsRequest` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `string`[]\> | A requested drain-principal list: each entry a principal key. Duplicates are removed, then the result must name at least one and at most [maxDrainPrincipals](../variables/maxDrainPrincipals.md) distinct principals, and is ascending. At most four times that many entries are read. |
| <a id="property-drainrequest"></a> `drainRequest` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISubscriptionDrainRequest`](ISubscriptionDrainRequest.md)\> | - |
| <a id="property-issued"></a> `issued` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIssuedTaskReceipt`](IIssuedTaskReceipt.md)\> | - |
| <a id="property-obligationdisposal"></a> `obligationDisposal` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskObligationDisposal`](ITaskObligationDisposal.md)\> | - |
| <a id="property-policy"></a> `policy` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskDeliveryPolicy`](ITaskDeliveryPolicy.md)\> | - |
| <a id="property-policyidentity"></a> `policyIdentity` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\> | A policy identity: one non-empty line. |
| <a id="property-policyoverrides"></a> `policyOverrides` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Partial`\<`Omit`\<[`ITaskDeliveryPolicy`](ITaskDeliveryPolicy.md), `"schemaVersion"`\>\>\> | A partial policy — a subscribe request's overrides, or a broker's delivery defaults. |
| <a id="property-receiptabandonment"></a> `receiptAbandonment` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskReceiptAbandonment`](ITaskReceiptAbandonment.md)\> | - |
| <a id="property-receiptacknowledgement"></a> `receiptAcknowledgement` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskReceiptAcknowledgement`](ITaskReceiptAcknowledgement.md)\> | - |
| <a id="property-receiptissue"></a> `receiptIssue` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskReceiptIssue`](ITaskReceiptIssue.md)\> | - |
| <a id="property-registration"></a> `registration` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskSubscriptionRegistration`](ITaskSubscriptionRegistration.md)\> | - |
| <a id="property-specification"></a> `specification` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskSubscriptionSpecification`](ITaskSubscriptionSpecification.md)\> | - |
| <a id="property-start"></a> `start` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SubscriptionStart`](../type-aliases/SubscriptionStart.md)\> | - |
| <a id="property-subscriberequest"></a> `subscribeRequest` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISubscribeRequest`](ISubscribeRequest.md)\> | - |
| <a id="property-subscriptionclosure"></a> `subscriptionClosure` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskSubscriptionClosure`](ITaskSubscriptionClosure.md)\> | - |
