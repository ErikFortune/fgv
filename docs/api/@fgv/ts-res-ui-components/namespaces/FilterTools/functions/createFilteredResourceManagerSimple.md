[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [FilterTools](../README.md) / createFilteredResourceManagerSimple

# Function: createFilteredResourceManagerSimple()

> **createFilteredResourceManagerSimple**(`originalSystem`, `partialContext`, `options`): `Promise`\<[`Result`](../../../type-aliases/Result.md)\<[`IProcessedResources`](../../ResourceTools/interfaces/IProcessedResources.md)\>\>

Creates a filtered resource manager by applying context filters to reduce resource candidates.

This function takes an original resource system and applies partial context filtering
to create a new resource manager with reduced candidate sets. Useful for creating
preview modes, testing specific configurations, or optimizing resource resolution.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `originalSystem` | \{ `contextQualifierProvider`: [`ValidatingSimpleContextQualifierProvider`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); `importManager`: [`ImportManager`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); `qualifiers`: [`IReadOnlyQualifierCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); `qualifierTypes`: [`ReadOnlyQualifierTypeCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); `resourceManager`: [`ResourceManagerBuilder`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); `resourceTypes`: [`ReadOnlyResourceTypeCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); \} | The original resource system to filter |
| `originalSystem.contextQualifierProvider` | [`ValidatingSimpleContextQualifierProvider`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | Provider for validating and managing runtime context |
| `originalSystem.importManager` | [`ImportManager`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | Manager for handling resource imports |
| `originalSystem.qualifiers` | [`IReadOnlyQualifierCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | Collection of qualifier declarations |
| `originalSystem.qualifierTypes` | [`ReadOnlyQualifierTypeCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | Collection of qualifier type definitions |
| `originalSystem.resourceManager` | [`ResourceManagerBuilder`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | Primary resource manager for building and managing resources |
| `originalSystem.resourceTypes` | [`ReadOnlyResourceTypeCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | Collection of resource type definitions |
| `partialContext` | `Record`\<`string`, `string` \| `undefined`\> | Filter values to apply for candidate reduction |
| `options` | [`IFilterOptions`](../interfaces/IFilterOptions.md) | Configuration options for filtering behavior |

## Returns

`Promise`\<[`Result`](../../../type-aliases/Result.md)\<[`IProcessedResources`](../../ResourceTools/interfaces/IProcessedResources.md)\>\>

Result containing the filtered ProcessedResources or error message

## Examples

```typescript
import { FilterTools } from '@fgv/ts-res-ui-components';

// Basic filtering with partial context
const originalResources = getProcessedResources();
const filterContext = { language: 'en-US', platform: 'web' };

const filteredResult = await FilterTools.createFilteredResourceManagerSimple(
  originalResources.system,
  filterContext
);

if (filteredResult.isSuccess()) {
  console.log('Filtered resources created successfully');
  const analysis = FilterTools.analyzeFilteredResources(
    originalResources.summary.resourceIds,
    filteredResult.value,
    originalResources
  );
  console.log(`Reduced candidates in ${analysis.filteredResources.length} resources`);
}
```

```typescript
// With advanced options and debug logging
const result = await FilterTools.createFilteredResourceManagerSimple(
  originalSystem,
  { language: 'fr-CA', region: 'quebec' },
  {
    partialContextMatch: true,
    enableDebugLogging: true,
    reduceQualifiers: false
  }
);

if (result.isFailure()) {
  console.error('Filtering failed:', result.message);
}
```
