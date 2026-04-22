[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [FilterTools](../README.md) / analyzeFilteredResources

# Function: analyzeFilteredResources()

> **analyzeFilteredResources**(`originalResourceIds`, `filteredProcessedResources`, `originalProcessedResources`): [`IFilterResult`](../interfaces/IFilterResult.md)

Analyzes the impact of filtering on resources by comparing original and filtered resource sets.

Compares original and filtered resources to provide detailed analysis of how filtering
affected each resource's candidate count. Identifies resources with potential issues
and provides warnings for resources that may have been over-filtered or have no candidates.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `originalResourceIds` | `string`[] | Array of resource IDs from the original system |
| `filteredProcessedResources` | [`IProcessedResources`](../../ResourceTools/interfaces/IProcessedResources.md) | The filtered resource system to analyze |
| `originalProcessedResources` | [`IProcessedResources`](../../ResourceTools/interfaces/IProcessedResources.md) | The original resource system for comparison |

## Returns

[`IFilterResult`](../interfaces/IFilterResult.md)

Analysis result with per-resource filtering impact and warnings

## Examples

```typescript
import { FilterTools } from '@fgv/ts-res-ui-components';

// After creating filtered resources
const originalIds = originalResources.summary.resourceIds;
const analysis = FilterTools.analyzeFilteredResources(
  originalIds,
  filteredResources,
  originalResources
);

if (analysis.success) {
  console.log(`Analyzed ${analysis.filteredResources.length} resources`);

  // Find resources with significant candidate reduction
  const heavilyFiltered = analysis.filteredResources.filter(r =>
    r.originalCandidateCount > 5 && r.filteredCandidateCount === 1
  );
  console.log(`${heavilyFiltered.length} resources heavily filtered`);

  // Check for warnings
  if (analysis.warnings.length > 0) {
    console.warn('Filter warnings:', analysis.warnings);
  }
}
```

```typescript
// Using analysis for UI display
const analysis = FilterTools.analyzeFilteredResources(resourceIds, filtered, original);

const resourcesWithIssues = analysis.filteredResources.filter(r => r.hasWarning);
if (resourcesWithIssues.length > 0) {
  showWarningDialog(
    `${resourcesWithIssues.length} resources may be over-filtered`,
    resourcesWithIssues.map(r => r.id)
  );
}
```
