[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / defaultTaskPerOwnerLimits

# Variable: defaultTaskPerOwnerLimits

> `const` **defaultTaskPerOwnerLimits**: [`ITaskPerOwnerLimits`](../interfaces/ITaskPerOwnerLimits.md)

The default per-owner limits.

## Remarks

`maxAcknowledgementIdsPerSubscription` (50,000) is a lifetime charge: closing a subscription
keeps its exact history. A consumer record holding it reserves up to
50,000 x `maxAcknowledgementEvidenceBytes` (512 B) = 24.41 MiB, which the default
`maxConsumerRecordBytes` of 32 MiB covers with its 64 KiB receipt-preparation claim.
