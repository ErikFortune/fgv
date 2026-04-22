[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [FilterTools](../README.md) / IFilteredResource

# Interface: IFilteredResource

Information about a single resource after filtering has been applied.

FilteredResource provides detailed analytics about how filtering affected
an individual resource, including candidate count changes and potential
issues detected during the filtering process. This information is essential
for understanding filtering effectiveness and diagnosing filtering problems.

## Examples

```typescript
import { FilterTools } from '@fgv/ts-res-ui-components';

// Analyze filter results for resources
const filterResult = await FilterTools.createFilteredResourceManagerSimple(
  processedResources,
  { language: 'en-US', platform: 'web' }
);

if (filterResult.isSuccess() && filterResult.value.success) {
  filterResult.value.filteredResources.forEach((resource: FilteredResource) => {
    console.log(`Resource ${resource.id}:`);
    console.log(`  Original candidates: ${resource.originalCandidateCount}`);
    console.log(`  Filtered candidates: ${resource.filteredCandidateCount}`);

    if (resource.hasWarning) {
      console.warn(`  ⚠️  Warning: Potential filtering issue detected`);
    }

    const reductionPercent = Math.round(
      ((resource.originalCandidateCount - resource.filteredCandidateCount) /
       resource.originalCandidateCount) * 100
    );
    console.log(`  Reduction: ${reductionPercent}%`);
  });
}
```

```typescript
// Use FilteredResource data in UI components
function FilterResultsSummary({ filteredResources }: { filteredResources: IFilteredResource[] }) {
  const totalOriginal = filteredResources.reduce((sum, r) => sum + r.originalCandidateCount, 0);
  const totalFiltered = filteredResources.reduce((sum, r) => sum + r.filteredCandidateCount, 0);
  const warningCount = filteredResources.filter(r => r.hasWarning).length;

  return (
    <div className="filter-summary">
      <h3>Filter Results Summary</h3>
      <div className="stats">
        <div>Resources: {filteredResources.length}</div>
        <div>Total candidates: {totalOriginal} → {totalFiltered}</div>
        <div>Reduction: {Math.round(((totalOriginal - totalFiltered) / totalOriginal) * 100)}%</div>
        {warningCount > 0 && (
          <div className="warnings">⚠️ {warningCount} resource(s) with warnings</div>
        )}
      </div>

      <div className="resource-list">
        {filteredResources.map(resource => (
          <div key={resource.id} className={resource.hasWarning ? 'has-warning' : ''}>
            <span className="resource-id">{resource.id}</span>
            <span className="candidate-counts">
              {resource.originalCandidateCount} → {resource.filteredCandidateCount}
            </span>
            {resource.hasWarning && <span className="warning-icon">⚠️</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

```typescript
// Filter resources by specific criteria
function analyzeFilteredResources(filteredResources: IFilteredResource[]) {
  // Find resources that were completely filtered out
  const completelyFiltered = filteredResources.filter(r =>
    r.filteredCandidateCount === 0 && r.originalCandidateCount > 0
  );

  // Find resources with significant candidate reduction
  const significantReduction = filteredResources.filter(r => {
    const reductionPercent = (r.originalCandidateCount - r.filteredCandidateCount) / r.originalCandidateCount;
    return reductionPercent > 0.5; // More than 50% reduction
  });

  // Find resources with warnings
  const withWarnings = filteredResources.filter(r => r.hasWarning);

  return {
    completelyFiltered: completelyFiltered.map(r => r.id),
    significantReduction: significantReduction.map(r => ({
      id: r.id,
      reductionPercent: Math.round(
        ((r.originalCandidateCount - r.filteredCandidateCount) / r.originalCandidateCount) * 100
      )
    })),
    withWarnings: withWarnings.map(r => r.id),
    totalResources: filteredResources.length
  };
}
```

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="filteredcandidatecount"></a> `filteredCandidateCount` | `number` | Number of candidates remaining after filtering |
| <a id="haswarning"></a> `hasWarning` | `boolean` | Whether this resource has potential filtering issues or warnings |
| <a id="id"></a> `id` | `string` | The resource ID that was filtered |
| <a id="originalcandidatecount"></a> `originalCandidateCount` | `number` | Number of candidates before filtering was applied |
