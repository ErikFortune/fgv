[Home](../README.md) > MoldId

# Type Alias: MoldId

Globally unique mold identifier (composite)
Format: "collectionId.baseMoldId"
Must contain exactly one dot separator
Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/

## Type

```typescript
type MoldId = Brand<string, "MoldId">
```
