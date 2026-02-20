[Home](../README.md) > generateConfectionVariationSpec

# Function: generateConfectionVariationSpec

Generates a unique ConfectionRecipeVariationSpec | ConfectionRecipeVariationSpec from
the given options, auto-selecting the next available index for the date if not specified.

## Signature

```typescript
function generateConfectionVariationSpec(existingSpecs: readonly ConfectionRecipeVariationSpec[], options: IGenerateVariationSpecOptions): Result<ConfectionRecipeVariationSpec>
```
