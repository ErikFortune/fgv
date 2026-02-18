[Home](../../README.md) > [LibraryRuntime](../README.md) > calculateIngredientWeight

# Function: calculateIngredientWeight

Calculate the weight contribution for a single ingredient.

Weight rules:
- 'g': amount × yieldFactor
- 'mL': amount × density × yieldFactor
- 'tsp', 'Tbsp', 'pinch', 'seeds', 'pods': Excluded (returns 0)

The yieldFactor (from ingredient modifiers) represents the fraction of the
ingredient that ends up in the final recipe after processing. Defaults to 1.0.

## Signature

```typescript
function calculateIngredientWeight(ingredient: IFillingIngredientEntity, context: IWeightCalculationContext): IWeightContribution
```
