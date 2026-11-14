[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskListCompletion

# Type Alias: TaskListCompletion

> **TaskListCompletion** = `"manual"` \| `"all-children-succeeded"`

How a task list reaches `succeeded`.

## Remarks

`all-children-succeeded` is a *recoverable derived action*, not a cross-record
transaction with child success: it requires at least one child, an authoritative
complete child set, every child succeeded and no active stop, and it is committed by
an explicit host reconciliation pass. An empty list needs explicit completion; an
ordinary tracked parent never aggregates at all.
