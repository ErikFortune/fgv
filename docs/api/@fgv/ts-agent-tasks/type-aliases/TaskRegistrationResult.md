[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskRegistrationResult

# Type Alias: TaskRegistrationResult

> **TaskRegistrationResult** = \{ `archived`: `boolean`; `state`: `"resolved"`; `task`: [`ITaskSnapshot`](../interfaces/ITaskSnapshot.md); \} \| \{ `reference`: [`IUnresolvedTaskReference`](../interfaces/IUnresolvedTaskReference.md); `state`: `"unresolved"`; \}

The result of registering, or reading, one task.

## Remarks

An unresolved registration returns its reference with no lifecycle invented.
