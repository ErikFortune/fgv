[Home](../../README.md) > [LibraryRuntime](../README.md) > [ChocolateLibrary](./ChocolateLibrary.md) > tasks

## ChocolateLibrary.tasks property

A materialized library of all tasks, keyed by composite ID.
Tasks are resolved lazily on access and cached.

**Signature:**

```typescript
readonly tasks: MaterializedLibrary<TaskId, IRawTaskEntity, Task, never>;
```
