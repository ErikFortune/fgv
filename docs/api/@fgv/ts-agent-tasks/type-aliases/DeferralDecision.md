[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / DeferralDecision

# Type Alias: DeferralDecision

> **DeferralDecision** = \{ `action`: `"expire"`; \} \| \{ `action`: `"wait"` \| `"hold"`; `notBefore`: `number`; \}

What [DeferredObligations.retry](../classes/DeferredObligations.md#retry) advises for an obligation that came due and could not be
discharged.

## Remarks

- `expire` — it is older than `maxDeferralMs`; the host ends it (`cancel`) and records why.
- `wait` — write the next `notBefore` with [DeferredObligations.wait](../classes/DeferredObligations.md#wait).
- `hold` — keep the next attempt in memory until `notBefore`, writing nothing: the backoff is at
  its cap, or the obligation has no waits left. A restart forgets the hold, which costs one early
  retry and never an obligation.
