[Home](../README.md) > TaskId

# Type Alias: TaskId

Globally unique task identifier (composite)
Format: "collectionId.baseTaskId"
Must contain exactly one dot separator
Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/

## Type

```typescript
type TaskId = Brand<string, "TaskId">
```
