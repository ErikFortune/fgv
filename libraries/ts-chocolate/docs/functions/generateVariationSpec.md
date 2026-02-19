[Home](../README.md) > generateVariationSpec

# Function: generateVariationSpec

Generates a unique FillingRecipeVariationSpec | FillingRecipeVariationSpec from
the given options, auto-selecting the next available index for the date if not specified.

## Signature

```typescript
function generateVariationSpec(existingSpecs: readonly FillingRecipeVariationSpec[], options: IGenerateVariationSpecOptions): Result<FillingRecipeVariationSpec>
```
