[Home](../README.md) > calculateTotalWeight

# Function: calculateTotalWeight

Calculate the total weight from all ingredients with unit conversion.

This function handles mixed-unit filling recipes by:
- Adding grams directly
- Converting milliliters to grams via ingredient density
- Excluding tsp, Tbsp, and pinch measurements

## Signature

```typescript
function calculateTotalWeight(ingredients: readonly IFillingIngredientEntity[], context: IWeightCalculationContext): Measurement
```
