[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / SourceObservationOutcome

# Type Alias: SourceObservationOutcome

> **SourceObservationOutcome** = `"applied"` \| `"refreshed"` \| `"health-changed"` \| `"unchanged"` \| `"stale"` \| `"incomparable"` \| `"deferred"` \| `"contract-violation"` \| `"capacity-blocked"` \| `"unknown-binding"` \| `"source-unavailable"` \| `"missing"`

What applying one source observation to one task did.

## Remarks

- `applied` — a newer projection committed; the task's revision advanced.
- `refreshed` — the same revision and projection, observed later: freshness only, no revision,
  no update.
- `health-changed` — observation health changed (an outage began or ended); lifecycle untouched.
- `unchanged` — nothing to do.
- `stale` — older than what is committed; ignored.
- `incomparable` — a different source epoch; ignored until explicit recovery.
- `deferred` — a hint for a `source-replay` source; the feed decides.
- `contract-violation` — the same revision with a different projection, a reopened terminal task,
  or a declared finite envelope exceeded. Nothing is committed.
- `capacity-blocked` — ordinary admission refused the growth; nothing is committed, and a pass
  stops there without moving its cursor.
- `unknown-binding` — no retained task holds this binding. Discovery needs a host catalog mapper;
  nothing is created.
- `source-unavailable` / `missing` — the read did not produce a projection.
