[Home](../README.md) > FillingRecipeVariationId

# Type Alias: FillingRecipeVariationId

Globally unique filling recipe variation identifier (composite)
Format: "fillingId@variationSpec" where fillingId is "collectionId.baseFillingId"
Examples: "user.ganache@2026-01-03-01", "felchlin.truffle@2026-01-03-02-less-sugar"

## Type

```typescript
type FillingRecipeVariationId = Brand<string, "FillingRecipeVariationId">
```
