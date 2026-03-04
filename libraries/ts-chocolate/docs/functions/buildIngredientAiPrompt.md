[Home](../README.md) > buildIngredientAiPrompt

# Function: buildIngredientAiPrompt

Builds a detailed AI prompt for generating an ingredient entity JSON object.
The prompt includes the full schema, all enum values, field descriptions,
and instructions for the AI to include notes describing assumptions.

## Signature

```typescript
function buildIngredientAiPrompt(ingredientName: string, additionalInstructions: string): AiPrompt
```
