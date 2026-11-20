[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskSubscriptionState

# Type Alias: TaskSubscriptionState

> **TaskSubscriptionState** = `"active"` \| `"closed"`

Whether a subscription still joins audiences.

## Remarks

- `active` — every matching commit owes it the categories it takes.
- `closed` — it joins no audience again. Obligations it kept at closure stay owed and remain
  drainable through its bound delivery; its record, identity slot and exact history are retained
  (no recycling in v1).
