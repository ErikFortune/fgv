[Home](../README.md) > [ILibraryRuntimeContext](./ILibraryRuntimeContext.md) > tasks

## ILibraryRuntimeContext.tasks property

A materialized library of all tasks, keyed by composite ID.
Tasks are resolved lazily on access and cached.
Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
`.values()` for iteration.

**Signature:**

```typescript
readonly tasks: MaterializedLibrary<TaskId, IRawTaskEntity, ITask, never>;
```
