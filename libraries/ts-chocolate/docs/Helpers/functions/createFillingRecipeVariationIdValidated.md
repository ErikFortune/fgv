[Home](../../README.md) > [Helpers](../README.md) > createFillingRecipeVariationIdValidated

# Function: createFillingRecipeVariationIdValidated

Creates and validates a FillingRecipeVariationId | filling variation ID from component parts.
Uses converter to ensure the formatted ID is valid.

## Signature

```typescript
function createFillingRecipeVariationIdValidated(parts: { collectionId: FillingId; itemId: FillingRecipeVariationSpec }): Result<FillingRecipeVariationId>
```
