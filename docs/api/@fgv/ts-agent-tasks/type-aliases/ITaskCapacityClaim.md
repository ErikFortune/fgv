[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskCapacityClaim

# Type Alias: ITaskCapacityClaim

> **ITaskCapacityClaim** = [`ITaskCapacityClaimCommon`](../interfaces/ITaskCapacityClaimCommon.md) & `object` \| [`ITaskCapacityClaimCommon`](../interfaces/ITaskCapacityClaimCommon.md) & `object` \| [`ITaskCapacityClaimCommon`](../interfaces/ITaskCapacityClaimCommon.md) & `object` \| [`ITaskCapacityClaimCommon`](../interfaces/ITaskCapacityClaimCommon.md) & `object` \| [`ITaskCapacityClaimCommon`](../interfaces/ITaskCapacityClaimCommon.md) & `object` \| [`ITaskCapacityClaimCommon`](../interfaces/ITaskCapacityClaimCommon.md) & `object`

A repository-generated reservation of capacity, discriminated on `purpose`.

## Remarks

**Claims are data the repository computes, never authority a caller issues.** No
request, command or tool argument type in this library accepts one, and every
request converter is strict, so a caller-supplied `capacityClaims` property is a
conversion failure rather than an overspend.

Each variant carries the identities needed to reconstruct its consumption after a
crash. Acknowledgement evidence is not a claim at all: it is joined by exact update ID and
subscription at open, so a committed acknowledgement is counted as history rather than also
as an unused reservation.
