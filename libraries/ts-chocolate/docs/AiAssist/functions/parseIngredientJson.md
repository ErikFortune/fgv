[Home](../../README.md) > [AiAssist](../README.md) > parseIngredientJson

# Function: parseIngredientJson

Parses and validates an unknown value (typically from AI-generated JSON)
into a validated IngredientEntity.

Strips the informational "notes" field before validation since it is not
part of the entity schema, but preserves it in the result for display.

## Signature

```typescript
function parseIngredientJson(from: unknown): Result<IIngredientParseResult>
```
