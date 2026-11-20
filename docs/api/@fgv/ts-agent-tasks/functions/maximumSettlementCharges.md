[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / maximumSettlementCharges

# Function: maximumSettlementCharges()

> **maximumSettlementCharges**(`profile`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ITaskCapacityCharge`](../interfaces/ITaskCapacityCharge.md)[]\>

The maximum capacity settling one already-accepted operation can charge.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `profile` | [`ITaskCapacityProfile`](../interfaces/ITaskCapacityProfile.md) |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ITaskCapacityCharge`](../interfaces/ITaskCapacityCharge.md)[]\>

## Remarks

Reserved before dispatch and held while the result is uncertain, so an accepted
attempt can always settle — even at pressure, and without consuming another ordinary
operation slot. A fresh retry under a *new* identity is new admission, not an
entitlement created by the first attempt.

Fails rather than returning an inexact figure when the profile's bounds push a product or
sum past the safe-integer range: a charge is an admission input, so "approximately the
maximum" is not a usable answer.
