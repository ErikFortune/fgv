[Home](../README.md) > IngredientId

# Type Alias: IngredientId

Globally unique ingredient identifier (composite)
Format: "collectionId.baseIngredientId"
Must contain exactly one dot separator
Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/

## Type

```typescript
type IngredientId = Brand<string, "IngredientId">
```
