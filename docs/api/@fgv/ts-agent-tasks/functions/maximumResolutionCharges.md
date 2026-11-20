[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / maximumResolutionCharges

# Function: maximumResolutionCharges()

> **maximumResolutionCharges**(`profile`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ITaskCapacityCharge`](../interfaces/ITaskCapacityCharge.md)[]\>

The maximum capacity an unresolved registration's first resolution can charge.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `profile` | [`ITaskCapacityProfile`](../interfaces/ITaskCapacityProfile.md) |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ITaskCapacityCharge`](../interfaces/ITaskCapacityCharge.md)[]\>

## Remarks

Design §8.6: "any unresolved registration also reserves first resolution and the path
through terminal closeout". First resolution replaces the unresolved reference with a
whole snapshot and may owe one required payload of every update category, so this is the
snapshot plus the per-category payloads, their audience links and acknowledgement
evidence. It is reserved *in addition to* [maximumClosureCharges](maximumClosureCharges.md), because the task
that resolves must still be able to finish.

Fails rather than returning an inexact figure, for the same reason as the closeout bundle.
