[Home](../README.md) > [UserLibrary](./UserLibrary.md) > ingredientInventory

## UserLibrary.ingredientInventory property

A materialized library of ingredient inventory entries, keyed by composite ID.
Inventory entries are materialized lazily on access and cached.

**Signature:**

```typescript
readonly ingredientInventory: MaterializedLibrary<IngredientInventoryEntryId, IIngredientInventoryEntryEntity, IIngredientInventoryEntry, never>;
```
