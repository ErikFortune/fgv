[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskDeliveryPumpParams

# Interface: ITaskDeliveryPumpParams

Parameters for [TaskDeliveryPump.create](../classes/TaskDeliveryPump.md#create).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-broker"></a> `broker` | `readonly` | [`TaskBroker`](../classes/TaskBroker.md) | The broker the subscription lives in. Its disposals go through it. |
| <a id="property-budget"></a> `budget?` | `readonly` | `Partial`\<`Omit`\<[`ITaskContextBudget`](ITaskContextBudget.md), `"maxItems"`\>\> | The depth and text bound of each render. Its item bound is always 1: one task revision is the unit the pump decides. Defaults to `defaultTaskContextBudget`'s depth and text bounds. |
| <a id="property-delivery"></a> `delivery` | `readonly` | [`IBoundTaskDeliveryParams`](IBoundTaskDeliveryParams.md) | The binding the pump delivers under — one principal, its authorization, and the subscription and consumer it drains. The same binding authorizes every disposal, so the pump can end only obligations that principal may end. |
| <a id="property-guard"></a> `guard?` | `readonly` | [`ITaskHostWriteGuard`](ITaskHostWriteGuard.md) | The gate every pump write passes through; see [ITaskHostWriteGuard](ITaskHostWriteGuard.md). |
