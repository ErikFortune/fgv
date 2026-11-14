[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / StoredCommandDispatch

# Type Alias: StoredCommandDispatch

> **StoredCommandDispatch** = `"not-sent"` \| `"possibly-sent"` \| `"settled"`

What a stored command's dispatch has reached.

## Remarks

`possibly-sent` is the marker written *before* an external send: once it is on disk, the
outcome is uncertain until the source settles it, even if the process died before the
send actually happened (design §5).
