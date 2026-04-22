[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / evaluateConditionsForCandidate

# Function: evaluateConditionsForCandidate()

> **evaluateConditionsForCandidate**(`resolver`, `candidateIndex`, `compiledResource`, `compiledCollection`): [`IConditionEvaluationResult`](../interfaces/IConditionEvaluationResult.md)[]

Evaluate conditions for a specific candidate and return detailed evaluation results.

Analyzes how each condition in a candidate's condition set evaluates against the
current resolution context. This provides detailed insight into why a candidate
matches or doesn't match, including qualification values, condition operators,
match scores, and match types.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resolver` | [`ResourceResolver`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | The configured ResourceResolver with context |
| `candidateIndex` | `number` | Zero-based index of the candidate to evaluate |
| `compiledResource` | [`ICompiledResource`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | The compiled resource containing decision information |
| `compiledCollection` | [`ICompiledResourceCollection`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | The compiled collection with condition and qualifier data |

## Returns

[`IConditionEvaluationResult`](../interfaces/IConditionEvaluationResult.md)[]

Array of condition evaluation results showing how each condition performed

## Examples

```typescript
import { ResolutionTools } from '@fgv/ts-res-ui-components';

// Evaluate conditions for the first candidate of a resource
const resolver = ResolutionTools.createResolverWithContext(
  processedResources,
  { language: 'en-US', platform: 'web' }
).orThrow();

const compiledResource = processedResources.compiledCollection.resources
  .find(r => r.id === 'welcome-message');

const evaluations = ResolutionTools.evaluateConditionsForCandidate(
  resolver,
  0, // First candidate
  compiledResource,
  processedResources.compiledCollection
);

// Analyze the results
evaluations.forEach(evaluation => {
  console.log(`${evaluation.qualifierName}: ${evaluation.qualifierValue} ${evaluation.operator} ${evaluation.conditionValue}`);
  console.log(`  Matched: ${evaluation.matched}, Score: ${evaluation.score}`);
});
```

```typescript
// Use in resolution analysis to understand candidate selection
function analyzeResourceResolution(resourceId: string) {
  const resolver = ResolutionTools.createResolverWithContext(
    processedResources,
    getCurrentContext()
  ).orThrow();

  const resource = processedResources.system.resourceManager
    .getBuiltResource(resourceId).orThrow();

  const compiledResource = processedResources.compiledCollection.resources
    .find(r => r.id === resourceId);

  // Evaluate all candidates
  resource.candidates.forEach((candidate, index) => {
    const evaluations = ResolutionTools.evaluateConditionsForCandidate(
      resolver,
      index,
      compiledResource,
      processedResources.compiledCollection
    );

    console.log(`Candidate ${index}:`);
    evaluations.forEach(eval => {
      console.log(`  ${eval.qualifierName}: ${eval.matched ? '✓' : '✗'} (${eval.score})`);
    });
  });
}
```
