[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / CycleGuardMode

# Type Alias: CycleGuardMode

> **CycleGuardMode** = `"reject"` \| `"off"`

How the write-time cycle guard behaves: `'reject'` (default — a cycle-inducing
edge fails the ingest) or `'off'` (no acyclicity constraint, for deployments
whose link graphs are legitimately cyclic — e.g. mutual associative links).
