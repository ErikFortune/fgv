[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskMutationToolGroup

# Type Alias: TaskMutationToolGroup

> **TaskMutationToolGroup** = `"tracked"` \| `"reassign"`

A group of mutation tools a host can opt into.

## Remarks

- `tracked` — `task_create` (a tracked task, optionally under a parent and with a responsible
  party) and `task_update` (a tracked task's title, description and progress).
- `reassign` — `task_reassign` (a task's responsible party).

Opting in makes a tool available; it authorizes nothing. Every call is authorized by the bound
writer's policy when it runs.
