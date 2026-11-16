[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / StopIntentState

# Type Alias: StopIntentState

> **StopIntentState** = `"pending"` \| `"blocked"` \| `"satisfied"` \| `"released"` \| `"settled"`

Where a cascade stop intent stands.

## Remarks

- `pending` — accepted; some target is not yet confirmed and none is known to block.
- `blocked` — some target blocks. Effects already applied stay applied: **there is no rollback**.
- `satisfied` — the last full pass confirmed every target.
- `released` — a host released the latch. Applied stops are not undone and commands already sent
  are not retracted; no further coordinated attempt is made.
- `settled` — a satisfied cancel whose root was archived; its report is retained.

The first three **latch**: while one stands, the captured subtree is frozen (design § 10 step 2).
**Acceptance is not completion**: an accepted stop is `pending`, and only a pump pass that visited
every target can make it `satisfied`.
