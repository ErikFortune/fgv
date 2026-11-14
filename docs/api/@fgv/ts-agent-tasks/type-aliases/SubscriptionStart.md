[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / SubscriptionStart

# Type Alias: SubscriptionStart

> **SubscriptionStart** = `"current"` \| `"from-now"`

Where a subscription's obligations start (design § 9).

## Remarks

- `current` — the subscription is owed a baseline: every selected task it may see, as it is at
  activation, including current attention and selected terminal tasks.
- `from-now` — no baseline; only commits after activation. The host chooses this explicitly.

There is no implicit historical replay in either.
