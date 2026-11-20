[Home](../../README.md) > [Generator](../README.md) > pickWeightedAt

# Function: pickWeightedAt

Chooses one candidate with probability proportional to its weight, as a pure
function of a unit float. The same `unit` and `candidates` always choose the
same item, so a caller whose randomness comes from elsewhere (for example a
hash ratio) gets a stable choice.

## Signature

```typescript
function pickWeightedAt(unit: number, candidates: readonly IWeightedCandidate<T>[]): T | undefined
```
