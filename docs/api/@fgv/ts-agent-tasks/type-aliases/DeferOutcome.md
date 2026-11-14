[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / DeferOutcome

# Type Alias: DeferOutcome

> **DeferOutcome** = `Extract`\<[`DeferredObligationState`](DeferredObligationState.md), \{ `state`: `"waiting"` \| `"settled"`; \}\>

What [DeferredObligations.defer](../classes/DeferredObligations.md#defer) answers: the obligation waiting, or the terminal status of
one already settled — `succeeded` when it was discharged through its task, `cancelled` when it was
ended undelivered, merged or abandoned (the reason code says which).
