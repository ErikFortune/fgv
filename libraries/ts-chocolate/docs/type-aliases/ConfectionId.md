[Home](../README.md) > ConfectionId

# Type Alias: ConfectionId

Globally unique confection identifier (composite)
Format: "collectionId.baseConfectionId"
Must contain exactly one dot separator
Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/

## Type

```typescript
type ConfectionId = Brand<string, "ConfectionId">
```
