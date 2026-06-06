[Home](../README.md) > analyzeFilteredResources

# Function: analyzeFilteredResources

Analyzes the impact of filtering on resources by comparing original and filtered resource sets.

Compares original and filtered resources to provide detailed analysis of how filtering
affected each resource's candidate count. Identifies resources with potential issues
and provides warnings for resources that may have been over-filtered or have no candidates.

## Signature

```typescript
function analyzeFilteredResources(originalResourceIds: string[], filteredProcessedResources: IProcessedResources, originalProcessedResources: IProcessedResources): IFilterResult
```
