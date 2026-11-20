[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskSubscriptionClosureMode

# Type Alias: TaskSubscriptionClosureMode

> **TaskSubscriptionClosureMode** = `"retain"` \| `"dispose"`

How a closing subscription ends what it is still owed (design § 9: "closing a subscription must
choose to retain owed work or disposition it explicitly").

## Remarks

- `retain` — every owed obligation stays owed, and drainable through the subscription's bound
  delivery; tasks carrying them stay unarchivable until each is acknowledged or disposed.
- `dispose` — every outstanding issued manifest is abandoned and every owed obligation is disposed
  with `reason`, in the same write.
