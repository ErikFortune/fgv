[Home](../../README.md) > [AiAssist](../README.md) > parseIngredientJson

# Function: parseIngredientJson

Parses and validates an unknown value (typically from AI-generated JSON)
into a validated IngredientEntity.

Handles both legacy plain-string `notes` (converted to categorized with
category "ai") and the new `ICategorizedNote[]` format. Notes are embedded
on the entity and also returned separately for convenience display.

## Signature

```typescript
function parseIngredientJson(from: unknown): Result<IIngredientParseResult>
```
