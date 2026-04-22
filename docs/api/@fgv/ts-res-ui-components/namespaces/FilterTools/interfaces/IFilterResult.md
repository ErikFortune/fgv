[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [FilterTools](../README.md) / IFilterResult

# Interface: IFilterResult

Complete result of a filtering operation including processed data and analysis.

IFilterResult encapsulates the outcome of applying resource filtering, providing
both the filtered resource system and detailed analytics about the filtering
process. It includes success/failure status, processed resources, per-resource
analysis, and any warnings or errors encountered during filtering.

## Examples

```typescript
import { FilterTools } from '@fgv/ts-res-ui-components';

// Apply filtering and handle results
async function applyResourceFilter(
  processedResources: IProcessedResources,
  context: Record<string, string>
) {
  const result = await FilterTools.createFilteredResourceManagerSimple(
    processedResources,
    context,
    { partialContextMatch: true, enableDebugLogging: false }
  );

  if (result.isSuccess()) {
    const filterResult: IFilterResult = result.value;

    if (filterResult.success) {
      console.log('Filter applied successfully!');
      console.log(`Processed ${filterResult.filteredResources.length} resources`);

      // Use the filtered resource system
      if (filterResult.processedResources) {
        console.log('Filtered resource system ready for use');
        return filterResult.processedResources;
      }

      // Check for warnings
      if (filterResult.warnings.length > 0) {
        filterResult.warnings.forEach(warning => {
          console.warn(`⚠️ Filter warning: ${warning}`);
        });
      }
    } else {
      console.error(`Filter failed: ${filterResult.error}`);
    }
  } else {
    console.error(`Filter operation failed: ${result.message}`);
  }
}
```

```typescript
// Use IFilterResult in React component for filter management
function FilterResultsPanel({ filterResult }: { filterResult: IFilterResult | null }) {
  if (!filterResult) {
    return <div className="no-filter">No filter applied</div>;
  }

  if (!filterResult.success) {
    return (
      <div className="filter-error">
        <h3>Filter Error</h3>
        <p>{filterResult.error}</p>
      </div>
    );
  }

  const stats = filterResult.filteredResources;
  const totalOriginal = stats.reduce((sum, r) => sum + r.originalCandidateCount, 0);
  const totalFiltered = stats.reduce((sum, r) => sum + r.filteredCandidateCount, 0);
  const resourcesWithWarnings = stats.filter(r => r.hasWarning).length;

  return (
    <div className="filter-results">
      <h3>Filter Results</h3>

      <div className="summary">
        <div className="stat">
          <label>Resources Processed:</label>
          <span>{stats.length}</span>
        </div>
        <div className="stat">
          <label>Total Candidates:</label>
          <span>{totalOriginal} → {totalFiltered}</span>
        </div>
        <div className="stat">
          <label>Reduction:</label>
          <span>{Math.round(((totalOriginal - totalFiltered) / totalOriginal) * 100)}%</span>
        </div>
      </div>

      {filterResult.warnings.length > 0 && (
        <div className="warnings">
          <h4>Warnings ({filterResult.warnings.length})</h4>
          <ul>
            {filterResult.warnings.map((warning, index) => (
              <li key={index} className="warning">{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {resourcesWithWarnings > 0 && (
        <div className="resource-warnings">
          <h4>Resources with Issues ({resourcesWithWarnings})</h4>
          <ul>
            {stats.filter(r => r.hasWarning).map(resource => (
              <li key={resource.id} className="resource-warning">
                {resource.id} - {resource.filteredCandidateCount}/{resource.originalCandidateCount} candidates
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

```typescript
// Advanced filter result analysis and validation
function validateFilterResults(filterResult: IFilterResult): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!filterResult.success) {
    issues.push(`Filter operation failed: ${filterResult.error}`);
    recommendations.push('Check filter configuration and resource data');
    return { isValid: false, issues, recommendations };
  }

  const resources = filterResult.filteredResources;

  // Check for completely filtered resources
  const completelyFiltered = resources.filter(r =>
    r.filteredCandidateCount === 0 && r.originalCandidateCount > 0
  );

  if (completelyFiltered.length > 0) {
    issues.push(`${completelyFiltered.length} resource(s) have no candidates after filtering`);
    recommendations.push('Consider using partial context matching or reviewing filter criteria');
  }

  // Check for excessive warnings
  const warningCount = filterResult.warnings.length;
  if (warningCount > resources.length * 0.1) { // More than 10% warning rate
    issues.push(`High warning rate: ${warningCount} warnings for ${resources.length} resources`);
    recommendations.push('Review resource configuration and filter parameters');
  }

  // Check for minimal filtering effect
  const totalOriginal = resources.reduce((sum, r) => sum + r.originalCandidateCount, 0);
  const totalFiltered = resources.reduce((sum, r) => sum + r.filteredCandidateCount, 0);
  const reductionPercent = ((totalOriginal - totalFiltered) / totalOriginal) * 100;

  if (reductionPercent < 5) { // Less than 5% reduction
    issues.push(`Filter had minimal effect: only ${reductionPercent.toFixed(1)}% candidate reduction`);
    recommendations.push('Consider more specific filter criteria or check if filtering is needed');
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
}
```

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="error"></a> `error?` | `string` | Error message if the filtering operation failed |
| <a id="filteredresources"></a> `filteredResources` | [`IFilteredResource`](IFilteredResource.md)[] | Analysis of individual resources after filtering, showing per-resource impact |
| <a id="processedresources"></a> `processedResources?` | [`IProcessedResources`](../../ResourceTools/interfaces/IProcessedResources.md) | The filtered processed resources, available if filtering succeeded |
| <a id="success"></a> `success` | `boolean` | Whether the filtering operation completed successfully |
| <a id="warnings"></a> `warnings` | `string`[] | Warning messages about potential filtering issues or edge cases |
