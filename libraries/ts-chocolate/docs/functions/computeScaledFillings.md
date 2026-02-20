[Home](../README.md) > computeScaledFillings

# Function: computeScaledFillings

Computes scaled filling amounts for a confection variation given a scaling target.

- **Molded bonbon:** uses `targetFrames` + mold geometry to compute per-slot weight
- **Bar/rolled truffle:** uses `targetCount` with linear scaling

Recipe slots produce a full `ProducedFilling` with scaled ingredient amounts.
Ingredient slots produce a computed target weight for the ingredient.

Returns `fail` if required inputs are missing (e.g., no `targetFrames` for bonbons,
mold has no `cavityWeight`, or a filling has zero base weight).

## Signature

```typescript
function computeScaledFillings(variation: AnyConfectionRecipeVariation, target: IConfectionScalingTarget): Result<IConfectionScalingResult>
```
