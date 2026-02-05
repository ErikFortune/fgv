[Home](../README.md) > calculateIngredientWeight

# Function: calculateIngredientWeight

Calculate the weight contribution for a single ingredient.

Weight rules:
- 'g': Added directly (amount in grams)
- 'mL': Converted to grams via density (amount * density)
- 'tsp', 'Tbsp', 'pinch': Excluded (returns 0)

## Signature

```typescript
function calculateIngredientWeight(ingredient: IFillingIngredientEntity, context: IWeightCalculationContext): IWeightContribution
```
