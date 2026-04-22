[Home](../../README.md) > [ResolutionTools](../README.md) > evaluateConditionsForCandidate

# Function: evaluateConditionsForCandidate

Evaluate conditions for a specific candidate and return detailed evaluation results.

Analyzes how each condition in a candidate's condition set evaluates against the
current resolution context. This provides detailed insight into why a candidate
matches or doesn't match, including qualification values, condition operators,
match scores, and match types.

## Signature

```typescript
function evaluateConditionsForCandidate(resolver: ResourceResolver, candidateIndex: number, compiledResource: ICompiledResource, compiledCollection: ICompiledResourceCollection): IConditionEvaluationResult[]
```
