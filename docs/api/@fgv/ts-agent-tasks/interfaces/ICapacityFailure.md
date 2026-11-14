[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ICapacityFailure

# Interface: ICapacityFailure

Structured detail accompanying a `backpressure` failure.

## Remarks

`reclaimableByCleanup` is what tells a host whether draining would help. It is always true for a
transient dimension. For a lifetime one — retained identities, exact acknowledgement history,
dedup evidence, subscriptions and sources, none of which cleanup releases once used — it is true
while part of the committed figure is a task's reservation, whose unspent remainder archiving that
task releases. It says draining *could* release some of it, not how much: a reservation the task
then spends in full releases nothing.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-dimension"></a> `dimension` | `readonly` | [`CapacityDimension`](../type-aliases/CapacityDimension.md) |
| <a id="property-limit"></a> `limit` | `readonly` | `number` |
| <a id="property-reason"></a> `reason` | `readonly` | `"capacity-exhausted"` |
| <a id="property-reclaimablebycleanup"></a> `reclaimableByCleanup` | `readonly` | `boolean` |
| <a id="property-recordid"></a> `recordId?` | `readonly` | `string` |
| <a id="property-requested"></a> `requested` | `readonly` | `number` |
| <a id="property-reserved"></a> `reserved` | `readonly` | `number` |
| <a id="property-used"></a> `used` | `readonly` | `number` |
