[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskConverters

# Class: TaskConverters

Every converter this library publishes, built against one set of field bounds.

## Remarks

Constructing this is pure: no filesystem, no clock, no registration of global state.
Nothing here is shared between instances, so two hosts with different bounds in one
process cannot see each other's limits.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-bounds"></a> `bounds` | `public readonly` | [`ITaskFieldBounds`](../interfaces/ITaskFieldBounds.md) | The field bounds these converters enforce. |
| <a id="property-broker"></a> `broker` | `public readonly` | [`IBrokerConverters`](../interfaces/IBrokerConverters.md) | Broker request, receipt and projected-value converters. |
| <a id="property-capacity"></a> `capacity` | `public readonly` | [`ICapacityConverters`](../interfaces/ICapacityConverters.md) | A3 capacity profile, claim and status converters. |
| <a id="property-commands"></a> `commands` | `public readonly` | [`ICommandConverters`](../interfaces/ICommandConverters.md) | Command request, state and receipt converters. |
| <a id="property-context"></a> `context` | `public readonly` | [`IContextConverters`](../interfaces/IContextConverters.md) | Summary, update, context input, budget and inclusion-receipt converters. |
| <a id="property-delivery"></a> `delivery` | `public readonly` | [`IDeliveryConverters`](../interfaces/IDeliveryConverters.md) | Subscription, consumer-record and delivery-request converters. |
| <a id="property-envelopes"></a> `envelopes` | `public readonly` | [`IEnvelopeConverters`](../interfaces/IEnvelopeConverters.md) | The common envelope and snapshot converters. |
| <a id="property-failures"></a> `failures` | `public readonly` | [`IFailureConverters`](../interfaces/IFailureConverters.md) | Classified failure converters. |
| <a id="property-ids"></a> `ids` | `public readonly` | [`IIdentityConverters`](../interfaces/IIdentityConverters.md) | Branded identity converters. |
| <a id="property-queries"></a> `queries` | `public readonly` | [`IQueryConverters`](../interfaces/IQueryConverters.md) | Repository query, due-query, owed-update query and page-cursor converters. |
| <a id="property-sources"></a> `sources` | `public readonly` | [`ISourceConverters`](../interfaces/ISourceConverters.md) | Converters for what an external source returns. |
| <a id="property-stops"></a> `stops` | `public readonly` | [`IStopConverters`](../interfaces/IStopConverters.md) | Cascade-stop intent, request and source-capability converters (T9). |
| <a id="property-storage"></a> `storage` | `public readonly` | [`IStorageConverters`](../interfaces/IStorageConverters.md) | Storage record, inventory and manifest converters. |
| <a id="property-values"></a> `values` | `public readonly` | [`IValueConverters`](../interfaces/IValueConverters.md) | Shared value converters — scopes, reasons, lifecycle, source observation. |

## Methods

### create()

> `static` **create**(`params?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TaskConverters`\>

Builds a converter set. Fails when a supplied bound is not a positive safe integer
or would raise a default.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params?` | [`ITaskConvertersCreateParams`](../interfaces/ITaskConvertersCreateParams.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TaskConverters`\>
