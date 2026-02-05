[Home](../../README.md) > [Confections](../README.md) > IChocolateSpec

# Type Alias: IChocolateSpec

Chocolate specification for shell, enrobing, or coating.
Uses IIdsWithPreferred pattern - `ids` contains all valid chocolates,
`preferredId` indicates the default/recommended one.

## Type

```typescript
type IChocolateSpec = IIdsWithPreferred<IngredientId>
```
