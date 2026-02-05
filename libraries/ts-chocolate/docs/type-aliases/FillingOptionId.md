[Home](../README.md) > FillingOptionId

# Type Alias: FillingOptionId

Union type for filling option IDs.
Can be either a RecipeId or IngredientId - disambiguation happens via the type discriminator.

## Type

```typescript
type FillingOptionId = FillingId | IngredientId
```
