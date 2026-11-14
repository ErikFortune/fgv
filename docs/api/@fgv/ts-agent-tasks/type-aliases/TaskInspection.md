[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskInspection

# Type Alias: TaskInspection

> **TaskInspection** = \{ `archived`: `boolean`; `commands`: `ReadonlyArray`\<`string`\>; `details?`: [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md); `envelope`: [`IProjectedTaskEnvelope`](IProjectedTaskEnvelope.md); `state`: `"resolved"`; \} \| \{ `reference`: [`IProjectedUnresolvedReference`](IProjectedUnresolvedReference.md); `state`: `"unresolved"`; \}

What a bound view's `inspect` returns.

## Remarks

`commands` are evaluated for this call against the current lifecycle and the current policy;
nothing about authority is cached in a record.
