[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IStopResult

# Interface: IStopResult

A stop's result, as one principal may see it.

## Remarks

`targets` holds only targets the principal may read; the intent itself is not filtered — a target
the principal cannot see is still a target. `restrictedWorkRemains` says, without counts or
identities, that some target the principal cannot see is not confirmed. `capacity` is present when
this call had to make a fresh attempt and could not admit it: the attempt was not made.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-capacity"></a> `capacity?` | `readonly` | [`ICapacityFailure`](ICapacityFailure.md) |
| <a id="property-intentid"></a> `intentId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-mode"></a> `mode` | `readonly` | [`StopMode`](../type-aliases/StopMode.md) |
| <a id="property-restrictedworkremains"></a> `restrictedWorkRemains` | `readonly` | `boolean` |
| <a id="property-rootid"></a> `rootId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
| <a id="property-state"></a> `state` | `readonly` | [`StopIntentState`](../type-aliases/StopIntentState.md) |
| <a id="property-targets"></a> `targets` | `readonly` | readonly [`IProjectedStopTarget`](../type-aliases/IProjectedStopTarget.md)[] |
