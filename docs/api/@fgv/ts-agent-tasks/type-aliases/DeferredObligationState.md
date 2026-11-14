[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / DeferredObligationState

# Type Alias: DeferredObligationState

> **DeferredObligationState** = \{ `state`: `"absent"`; \} \| \{ `createdAt`: [`Instant`](Instant.md); `kind`: [`TaskKind`](TaskKind.md); `revision`: [`TaskRevision`](TaskRevision.md); `scopes`: `ReadonlyArray`\<[`ITaskScope`](../interfaces/ITaskScope.md)\>; `state`: `"pending"`; \} \| \{ `obligation`: [`IDeferredObligation`](../interfaces/IDeferredObligation.md); `state`: `"waiting"`; \} \| \{ `archived`: `boolean`; `state`: `"settled"`; `status`: [`TaskLifecycleStatus`](TaskLifecycleStatus.md); \}

What the repository holds for one obligation: none; one created and not yet waiting (a deferral
interrupted between its two writes); one waiting; or one settled — terminal or archived.

## Union Members

### Type Literal

\{ `state`: `"absent"`; \}

***

### Type Literal

\{ `createdAt`: [`Instant`](Instant.md); `kind`: [`TaskKind`](TaskKind.md); `revision`: [`TaskRevision`](TaskRevision.md); `scopes`: `ReadonlyArray`\<[`ITaskScope`](../interfaces/ITaskScope.md)\>; `state`: `"pending"`; \}

| Name | Type | Description |
| ------ | ------ | ------ |
| `createdAt` | [`Instant`](Instant.md) | - |
| `kind` | [`TaskKind`](TaskKind.md) | What the task under the obligation's id is — checked before it is adopted. |
| `revision` | [`TaskRevision`](TaskRevision.md) | - |
| `scopes` | `ReadonlyArray`\<[`ITaskScope`](../interfaces/ITaskScope.md)\> | - |
| `state` | `"pending"` | - |

***

### Type Literal

\{ `obligation`: [`IDeferredObligation`](../interfaces/IDeferredObligation.md); `state`: `"waiting"`; \}

***

### Type Literal

\{ `archived`: `boolean`; `state`: `"settled"`; `status`: [`TaskLifecycleStatus`](TaskLifecycleStatus.md); \}
