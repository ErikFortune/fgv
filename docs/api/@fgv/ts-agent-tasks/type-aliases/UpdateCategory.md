[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / UpdateCategory

# Type Alias: UpdateCategory

> **UpdateCategory** = `"lifecycle"` \| `"progress"` \| `"attention"` \| `"result"` \| `"assignment"` \| `"observation"` \| `"relationship"`

The categories of owed update a task commit can produce.

## Remarks

The set is closed and its size is load-bearing: a terminal closeout must reserve room
for one required payload of every category, so "at most seven" is an arithmetic input
to [maximumClosureCharges](../functions/maximumClosureCharges.md), not a description.
