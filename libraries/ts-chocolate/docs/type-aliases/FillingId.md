[Home](../README.md) > FillingId

# Type Alias: FillingId

Globally unique filling recipe identifier (composite)
Format: "collectionId.baseFillingId"
Must contain exactly one dot separator
Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/

## Type

```typescript
type FillingId = Brand<string, "FillingId">
```
