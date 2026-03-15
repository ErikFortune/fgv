[Home](../../../README.md) > [Entities](../../README.md) > [Tasks](../README.md) > TaskRefStatus

# Type Alias: TaskRefStatus

Validation status for a step's task reference.
Used at load time to mark incomplete references without hard failing.

## Type

```typescript
type TaskRefStatus = "valid" | "task-not-found" | "missing-variables" | "invalid-params"
```
