[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskFailureCode

# Type Alias: TaskFailureCode

> **TaskFailureCode** = `"invalid"` \| `"not-found-or-denied"` \| `"conflict"` \| `"unsupported"` \| `"storage-unavailable"` \| `"storage-corrupt"` \| `"commit-indeterminate"` \| `"source-unavailable"` \| `"source-gap"` \| `"unknown-kind-version"` \| `"invalid-receipt"` \| `"cursor-stale"` \| `"retention-blocked"` \| `"backpressure"`

The classified failure codes every task operation reports.

## Remarks

`not-found-or-denied` is deliberately one code: a foreign identity and a hidden one
must be indistinguishable. `commit-indeterminate` says the durable effect may or may
not exist and carries the operation ID to resolve it by.
