[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskCapacityProfile

# Interface: ITaskCapacityProfile

The versioned whole-repository capacity policy.

## Remarks

Stored with the repository so that a host's changed defaults cannot silently
reinterpret an existing repository on reopen. Limits may be raised explicitly under
exclusive ownership; lowering them in place is unsupported in v1.

These are proposed engineering defaults, **not measured safe maxima** — see
[defaultTaskCapacityProfile](../variables/defaultTaskCapacityProfile.md).

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-encoded"></a> `encoded` | `readonly` | [`ITaskEncodedBounds`](ITaskEncodedBounds.md) |
| <a id="property-limits"></a> `limits` | `readonly` | [`TaskCapacityLimits`](../type-aliases/TaskCapacityLimits.md) |
| <a id="property-perowner"></a> `perOwner` | `readonly` | [`ITaskPerOwnerLimits`](ITaskPerOwnerLimits.md) |
| <a id="property-profileversion"></a> `profileVersion` | `readonly` | `1` |
