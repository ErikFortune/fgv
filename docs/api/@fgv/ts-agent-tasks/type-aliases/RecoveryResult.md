[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / RecoveryResult

# Type Alias: RecoveryResult

> **RecoveryResult** = \{ `state`: `"reattached"` \| `"completed"`; `value`: [`ISourceProjection`](../interfaces/ISourceProjection.md); \} \| \{ `reference`: [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md); `state`: `"resumable"`; \} \| \{ `reason`: `string`; `state`: `"unrecoverable"`; `value`: [`ISourceProjection`](../interfaces/ISourceProjection.md); \} \| \{ `reason`: `string`; `state`: `"unavailable"` \| `"unresolved"`; \}

Result of asking a source to recover a task.

## Remarks

`resumable` returns work to the host for explicit approval; it never resumes on its
own. `unresolved` is distinct from `unavailable`: the source answered, but could not
establish what became of the work.

`unrecoverable` carries the source's own terminal projection — `failed` or `cancelled` — at
the revision it declares the work lost. (T6 revision: T1's variant carried a reason only,
which left the broker to *invent* the failed state it applies. A source-confirmed failure is
an observation like any other, with a revision that deduplicates it; no persisted record ever
carried the old shape.)
