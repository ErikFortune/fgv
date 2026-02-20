[Home](../../README.md) > [Helpers](../README.md) > generateFillingVariationSpec

# Function: generateFillingVariationSpec

Generates a unique FillingRecipeVariationSpec | FillingRecipeVariationSpec from
the given options, auto-selecting the next available index for the date if not specified.

## Signature

```typescript
function generateFillingVariationSpec(existingSpecs: readonly FillingRecipeVariationSpec[], options: IGenerateVariationSpecOptions): Result<FillingRecipeVariationSpec>
```
