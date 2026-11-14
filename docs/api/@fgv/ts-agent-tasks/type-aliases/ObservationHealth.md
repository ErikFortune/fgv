[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ObservationHealth

# Type Alias: ObservationHealth

> **ObservationHealth** = \{ `observedAt`: [`Instant`](Instant.md); `state`: `"current"`; \} \| \{ `checkedAt`: [`Instant`](Instant.md); `lastObservedAt?`: [`Instant`](Instant.md); `reason`: `string`; `state`: `"stale"` \| `"unavailable"`; \}

Health of the broker's *observation* of a task, independent of the task's execution
lifecycle.

## Remarks

A source outage makes observation `stale` or `unavailable`; it never moves the task
through its lifecycle.
