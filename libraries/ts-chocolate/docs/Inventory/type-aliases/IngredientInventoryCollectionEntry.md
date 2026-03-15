[Home](../../README.md) > [Inventory](../README.md) > IngredientInventoryCollectionEntry

# Type Alias: IngredientInventoryCollectionEntry

A single entry in an ingredient inventory collection.
Keyed by the inventory entry's base ID (not the ingredient's ID).
The entry's `ingredientId` field contains the composite IngredientId of the ingredient being inventoried.

## Type

```typescript
type IngredientInventoryCollectionEntry = SubLibraryCollectionEntry<IngredientInventoryEntryBaseId, IIngredientInventoryEntryEntity>
```
