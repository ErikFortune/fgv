[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskLifecycle

# Type Alias: TaskLifecycle

> **TaskLifecycle** = \{ `status`: `"pending"` \| `"running"`; \} \| \{ `reason`: [`IWaitingReason`](../interfaces/IWaitingReason.md); `status`: `"waiting"`; \} \| \{ `reason`: [`ITaskReason`](../interfaces/ITaskReason.md); `status`: `"paused"`; \} \| \{ `outcome`: [`ITaskOutcome`](../interfaces/ITaskOutcome.md); `status`: `"succeeded"`; \} \| \{ `outcome?`: [`ITaskOutcome`](../interfaces/ITaskOutcome.md); `reason`: [`ITaskReason`](../interfaces/ITaskReason.md); `status`: `"failed"` \| `"cancelled"`; \}

Execution lifecycle of a task, discriminated on `status`.

## Remarks

The payload each state carries is what makes the state meaningful: a waiting task
must say what it waits for, a succeeded task must carry its outcome. Observation
health is deliberately *not* part of this union — a source outage cannot move a task
through its lifecycle.
