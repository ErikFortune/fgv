[Home](../../../README.md) > [Entities](../../README.md) > [Fillings](../README.md) > [IIngredientModifiers](./IIngredientModifiers.md) > yieldFactor

## IIngredientModifiers.yieldFactor property

Fraction of ingredient contributing to final recipe weight after processing.
- 1.0 (default when omitted): Full contribution
- 0.0: No contribution (e.g., coffee beans steeped in cream and strained out)
- Between 0 and 1: Partial contribution (e.g., 300g cream reduced to 200g is 0.67)
Applied after scaling: weightContribution = scaledAmount * yieldFactor * density

**Signature:**

```typescript
readonly yieldFactor: number;
```
