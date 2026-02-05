[Home](../../../README.md) > [Entities](../../README.md) > [Confections](../README.md) > ICoatingsEntity

# Type Alias: ICoatingsEntity

Coating specification for rolled truffles.
Uses IIdsWithPreferred pattern - `ids` contains all valid coating ingredients,
`preferredId` indicates the default/recommended one.

## Type

```typescript
type ICoatingsEntity = IIdsWithPreferred<IngredientId>
```
