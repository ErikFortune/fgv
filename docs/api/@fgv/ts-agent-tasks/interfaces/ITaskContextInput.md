[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskContextInput

# Interface: ITaskContextInput

What a host hands the renderer: already-authorized, already-selected task values.

## Remarks

`tasks` is current state, at most one revision per task; duplicates of the same revision
(overlapping scope selections, typically) collapse, and a conflict fails. `updates` are
change payloads the host is presenting, and are the only source of update IDs — a
snapshot-only host that supplies none gets a receipt with none. Snapshots are accepted in
`tasks`; their details are discarded, never rendered.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-completeness"></a> `completeness` | `readonly` | [`TaskInputCompleteness`](../type-aliases/TaskInputCompleteness.md) |
| <a id="property-deliveryid"></a> `deliveryId?` | `readonly` | [`DeliveryId`](../type-aliases/DeliveryId.md) |
| <a id="property-tasks"></a> `tasks` | `readonly` | readonly [`ITaskSummary`](ITaskSummary.md)[] |
| <a id="property-unresolved"></a> `unresolved?` | `readonly` | readonly [`IContextUnresolvedReference`](../type-aliases/IContextUnresolvedReference.md)[] |
| <a id="property-updates"></a> `updates?` | `readonly` | readonly [`ITaskUpdate`](ITaskUpdate.md)[] |
