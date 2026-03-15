[Home](../../README.md) > [Entities](../README.md) > ITaskEntityInvocation

# Type Alias: ITaskEntityInvocation

A task invocation - either a reference to a library task or an inline task definition.
Discriminated by the presence of `task` (inline) vs `taskId` (ref).

## Type

```typescript
type ITaskEntityInvocation = IInlineTaskEntity | ITaskRefEntity
```
