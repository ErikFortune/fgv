[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / SourceCommandRejection

# Type Alias: SourceCommandRejection

> **SourceCommandRejection** = `"unsupported"` \| `"conflict"` \| `"invalid-transition"`

Why a source definitively refused a command.

## Remarks

`conflict` is the source's precondition failing — a refusal, never an optimistic status update.
