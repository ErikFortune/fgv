[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / maximumClosureCharges

# Function: maximumClosureCharges()

> **maximumClosureCharges**(`profile`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ITaskCapacityCharge`](../interfaces/ITaskCapacityCharge.md)[]\>

The maximum capacity a task's terminal closeout can charge, computed from schema
maxima alone.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `profile` | [`ITaskCapacityProfile`](../interfaces/ITaskCapacityProfile.md) |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ITaskCapacityCharge`](../interfaces/ITaskCapacityCharge.md)[]\>

## Remarks

A ceiling without protected completion space is not a ceiling — it could refuse the
terminal write or acknowledgement that would free capacity. So this bundle is
reserved at *acceptance*, before the task exists: one absorbing terminal snapshot
replacement, one required payload of each of the seven update categories with their
audience links and per-audience acknowledgement evidence, terminal operation
evidence, and one archive operation receipt.

Acknowledgement evidence is `acknowledgement-ids` plus `maxAcknowledgementEvidenceBytes` of
`logical-bytes` per link (T7). When a commit adds those links, their evidence is *spent* from
this claim and held by the subscriptions they name until each exact acknowledgement lands — a
transfer, never a second charge.

Closeout is a bounded path, not an unlimited emergency pool. Ordinary progress,
repeated attention changes, reassignment, new subscriptions and new command attempts
can all still be refused while this room is held.

Fails rather than returning an inexact figure when the profile's bounds push a product or
sum past the safe-integer range: a charge is an admission input, so "approximately the
maximum" is not a usable answer.
