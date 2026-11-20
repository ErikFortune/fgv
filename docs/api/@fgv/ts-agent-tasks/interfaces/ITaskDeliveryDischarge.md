[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskDeliveryDischarge

# Interface: ITaskDeliveryDischarge

How a prepared delivery was discharged.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-alreadydischarged"></a> `alreadyDischarged` | `readonly` | readonly [`UpdateId`](../type-aliases/UpdateId.md)[] | The ids that were already in the history — a replay, or a decision made elsewhere first. |
| <a id="property-discharged"></a> `discharged` | `readonly` | readonly [`UpdateId`](../type-aliases/UpdateId.md)[] | The ids this call added to the subscription's history. |
| <a id="property-issues"></a> `issues` | `readonly` | readonly `string`[] | The follow-up steps that did not complete **after** the decision committed: the receipt not released (it stays issued until it expires, occupying a receipt slot and pinning what it names), or the superseded revisions not disposed (they stay owed and are presented on their own). The decision itself stands either way. |
| <a id="property-outcome"></a> `outcome` | `readonly` | [`TaskDeliveryOutcome`](../type-aliases/TaskDeliveryOutcome.md) | - |
| <a id="property-prepared"></a> `prepared` | `readonly` | [`IPreparedTaskDelivery`](IPreparedTaskDelivery.md) | - |
| <a id="property-superseded"></a> `superseded` | `readonly` | readonly [`UpdateId`](../type-aliases/UpdateId.md)[] | The older owed revisions of the same task disposed after a terminal discharge. |
