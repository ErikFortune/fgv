[Home](../../README.md) > [Helpers](../README.md) > generateVariationSpec

# Function: generateVariationSpec

Generates a unique variation spec of the given branded type from the given options,
auto-selecting the next available index for the date if not specified.
The converter validates and brands the resulting string.

## Signature

```typescript
function generateVariationSpec(existingSpecs: readonly TSpec[], converter: Converter<TSpec>, options: IGenerateVariationSpecOptions): Result<TSpec>
```
