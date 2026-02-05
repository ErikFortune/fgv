[Home](../README.md) > ProcedureId

# Type Alias: ProcedureId

Globally unique procedure identifier (composite)
Format: "collectionId.baseProcedureId"
Must contain exactly one dot separator
Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/

## Type

```typescript
type ProcedureId = Brand<string, "ProcedureId">
```
