[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskMutationDisposition

# Type Alias: TaskMutationDisposition

> **TaskMutationDisposition** = `"changed"` \| `"unchanged"`

Whether a mutation changed semantic state. An `unchanged` mutation advances no task revision;
its evidence is still recorded, so a retry with the same key replays it.
