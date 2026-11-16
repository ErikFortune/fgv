[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / CapacityClaimOwner

# Type Alias: CapacityClaimOwner

> **CapacityClaimOwner** = \{ `owner`: `"task"`; `taskId`: [`TaskId`](TaskId.md); \} \| \{ `owner`: `"subscription"`; `subscriptionId`: [`SubscriptionId`](SubscriptionId.md); \} \| \{ `operationId`: [`OperationId`](OperationId.md); `owner`: `"operation"`; `taskId`: [`TaskId`](TaskId.md); \}

Which record currently owns a claim.

## Remarks

Ownership moves by stable claim ID during the ordered registration protocol — a
pending inventory entry owns a claim until its record goes live. Transfer never
double-charges and never releases early.
