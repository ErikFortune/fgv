[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TrackedTransition

# Type Alias: TrackedTransition

> **TrackedTransition** = \{ `categories`: `ReadonlyArray`\<[`UpdateCategory`](UpdateCategory.md)\>; `disposition`: `"changed"`; `envelope`: [`ITaskEnvelope`](../interfaces/ITaskEnvelope.md); \} \| \{ `disposition`: `"unchanged"`; \} \| \{ `disposition`: `"rejected"`; `reason`: `"invalid-transition"` \| `"unsupported"`; \}

What evaluating one tracked command or patch against a task's current envelope yields.

## Remarks

`changed` carries the next envelope with the revision and `changedAt` left for the caller to
advance, and the update categories the change touches. `unchanged` is a same-state semantic
no-op: it advances no revision. `rejected` is a well-formed request the transition table does
not allow.
