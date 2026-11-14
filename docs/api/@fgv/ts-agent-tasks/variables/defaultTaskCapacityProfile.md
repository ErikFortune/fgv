[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / defaultTaskCapacityProfile

# Variable: defaultTaskCapacityProfile

> `const` **defaultTaskCapacityProfile**: [`ITaskCapacityProfile`](../interfaces/ITaskCapacityProfile.md)

The default capacity profile: [defaultTaskCapacityLimits](defaultTaskCapacityLimits.md),
[defaultTaskPerOwnerLimits](defaultTaskPerOwnerLimits.md) and [defaultTaskEncodedBounds](defaultTaskEncodedBounds.md). Their remarks say what
each admits and how to raise it.

## Remarks

A finite horizon, not indefinite operation: v1 supplies no deletion, identity reset,
repository rotation with continuity, cross-root migration or compaction escape hatch.
Archiving and draining release payload and non-archived capacity; they do not release
retained identities, exact acknowledgement IDs or dedup evidence.
