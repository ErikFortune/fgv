[Home](../../README.md) > [LibraryRuntime](../README.md) > [LibraryRuntimeContext](./LibraryRuntimeContext.md) > ingredients

## LibraryRuntimeContext.ingredients property

A searchable library of all ingredients, keyed by composite ID.
Ingredients are resolved lazily on access and cached.

**Signature:**

```typescript
readonly ingredients: MaterializedLibrary<IngredientId, IngredientEntity, AnyIngredient, IIngredientQuerySpec>;
```
