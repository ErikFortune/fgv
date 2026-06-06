[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / resolveResourceDetailed

# Function: resolveResourceDetailed()

> **resolveResourceDetailed**(`resolver`, `resourceId`, `processedResources`, `options`): [`Result`](../../../type-aliases/Result.md)\<[`IResolutionResult`](../interfaces/IResolutionResult.md)\<`unknown`, [`JsonValue`](../../../type-aliases/JsonValue.md)\>\>

Resolve a resource and create detailed resolution result with comprehensive analysis.

Performs complete resource resolution including best candidate selection, all candidate
analysis, composed value resolution, and detailed condition evaluation for each candidate.
This provides the most comprehensive view of how resource resolution works for a given
resource and context.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resolver` | [`ResourceResolver`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | The configured ResourceResolver with context |
| `resourceId` | `string` | The ID of the resource to resolve |
| `processedResources` | [`IProcessedResources`](../../ResourceTools/interfaces/IProcessedResources.md) | The processed resource system |
| `options` | [`IResolutionOptions`](../interfaces/IResolutionOptions.md) | Configuration options for resolution behavior |

## Returns

[`Result`](../../../type-aliases/Result.md)\<[`IResolutionResult`](../interfaces/IResolutionResult.md)\<`unknown`, [`JsonValue`](../../../type-aliases/JsonValue.md)\>\>

A Result containing detailed resolution information or an error

## Examples

```typescript
import { ResolutionTools } from '@fgv/ts-res-ui-components';

// Detailed resolution of a welcome message
const resolver = ResolutionTools.createResolverWithContext(
  processedResources,
  { language: 'en-US', platform: 'web', region: 'US' }
).orThrow();

const result = ResolutionTools.resolveResourceDetailed(
  resolver,
  'welcome-message',
  processedResources
);

if (result.isSuccess() && result.value.success) {
  const resolution = result.value;
  console.log('Best candidate:', resolution.bestCandidate);
  console.log('Composed value:', resolution.composedValue);

  // Analyze each candidate
  resolution.candidateDetails.forEach((candidate, index) => {
    console.log(`Candidate ${index}: ${candidate.matched ? 'MATCHED' : 'no match'}`);
    candidate.conditionEvaluations.forEach(eval => {
      console.log(`  ${eval.qualifierName}: ${eval.matched ? '✓' : '✗'}`);
    });
  });
}
```

```typescript
// Resolution with debugging for troubleshooting
const debugResult = ResolutionTools.resolveResourceDetailed(
  resolver,
  'error-messages',
  processedResources,
  { enableDebugLogging: true }
);

// Debug output will show detailed resolution steps
```

```typescript
// Use in resolution testing workflow
async function testResourceResolution(resourceId: string, context: Record<string, string>) {
  const resolver = ResolutionTools.createResolverWithContext(
    processedResources,
    context
  ).orThrow();

  const result = ResolutionTools.resolveResourceDetailed(
    resolver,
    resourceId,
    processedResources
  );

  if (result.isSuccess() && result.value.success) {
    const resolution = result.value;

    return {
      resourceId,
      context,
      bestValue: resolution.bestCandidate?.value,
      composedValue: resolution.composedValue,
      matchedCandidates: resolution.candidateDetails.filter(c => c.matched).length,
      totalCandidates: resolution.candidateDetails.length,
      conditionAnalysis: resolution.candidateDetails.map(c => ({
        matched: c.matched,
        matchType: c.matchType,
        conditions: c.conditionEvaluations.length
      }))
    };
  }

  throw new Error(`Resolution failed: ${result.value.error}`);
}
```
