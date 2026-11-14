[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskAccessRole

# Type Alias: TaskAccessRole

> **TaskAccessRole** = `"subject"` \| `"parent"` \| `"previous-parent"` \| `"new-parent"` \| `"stop-target"`

Which task an access request is about, relative to the operation.

## Remarks

A relationship operation authorizes the child and both affected parents explicitly, so a
policy can tell "may move this task" from "may move a task under this one" from "may take a
task out from under this one".
