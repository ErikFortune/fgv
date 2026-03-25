[Home](../../README.md) > [Runtime](../README.md) > DecisionResolutionResult

# Type Alias: DecisionResolutionResult

Represents the cached result of resolving a decision.
Contains either a failure indicator or a list of instance indices for matching condition sets,
ordered by condition set priority.

## Type

```typescript
type DecisionResolutionResult = { success: false } | { success: true; instanceIndices: ReadonlyArray<number>; defaultInstanceIndices: ReadonlyArray<number> }
```
