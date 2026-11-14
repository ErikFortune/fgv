[Home](../README.md) > createFilteredResourceManagerSimple

# Function: createFilteredResourceManagerSimple

Creates a filtered resource manager by applying context filters to reduce resource candidates.

This function takes an original resource system and applies partial context filtering
to create a new resource manager with reduced candidate sets. Useful for creating
preview modes, testing specific configurations, or optimizing resource resolution.

## Signature

```typescript
function createFilteredResourceManagerSimple(originalSystem: { resourceManager: ResourceManagerBuilder; qualifierTypes: ReadOnlyQualifierTypeCollector; qualifiers: IReadOnlyQualifierCollector; resourceTypes: ReadOnlyResourceTypeCollector; importManager: ImportManager; contextQualifierProvider: ValidatingSimpleContextQualifierProvider }, partialContext: Record<string, string | undefined>, options: IFilterOptions): Promise<Result<IProcessedResources>>
```
