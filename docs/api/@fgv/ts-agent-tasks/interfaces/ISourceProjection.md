[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ISourceProjection

# Interface: ISourceProjection

One observation of a task's execution state, as projected by its source.

## Remarks

Only execution fields appear here. Parent, responsibility, scopes, identity and the
source binding itself are catalog-owned and cannot be changed by an observation.

This slice declares it because [RecoveryResult](../type-aliases/RecoveryResult.md) carries one. The source
*interface* that produces projections, and the read result of observing a binding,
belong to the slice that implements reconciliation.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-attention"></a> `attention` | `readonly` | readonly [`ITaskReference`](ITaskReference.md)[] |
| <a id="property-details"></a> `details` | `readonly` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) |
| <a id="property-lifecycle"></a> `lifecycle` | `readonly` | [`TaskLifecycle`](../type-aliases/TaskLifecycle.md) |
| <a id="property-observedat"></a> `observedAt` | `readonly` | [`Instant`](../type-aliases/Instant.md) |
| <a id="property-progress"></a> `progress?` | `readonly` | [`ITaskProgress`](ITaskProgress.md) |
| <a id="property-revision"></a> `revision` | `readonly` | [`ISourceRevision`](ISourceRevision.md) |
