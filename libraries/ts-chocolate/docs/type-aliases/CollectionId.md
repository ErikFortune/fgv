[Home](../README.md) > CollectionId

# Type Alias: CollectionId

Unique identifier for a source collection (of ingredients/recipes, etc)
Character restrictions: alphanumeric, dashes, underscores only (no dots)
Pattern: /^[a-zA-Z0-9_-]+$/

## Type

```typescript
type CollectionId = Brand<string, "CollectionId">
```
