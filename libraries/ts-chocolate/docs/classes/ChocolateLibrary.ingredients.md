[Home](../README.md) > [ChocolateLibrary](./ChocolateLibrary.md) > ingredients

## ChocolateLibrary.ingredients property

A searchable library of all ingredients, keyed by composite ID.
Ingredients are resolved lazily on access and cached.

**Signature:**

```typescript
readonly ingredients: MaterializedLibrary<IngredientId, IngredientEntity, AnyIngredient, IIngredientQuerySpec>;
```
