[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [FilterTools](../README.md) / hasFilterValues

# Function: hasFilterValues()

> **hasFilterValues**(`values`): `boolean`

Checks if a filter values object contains any meaningful (non-empty) filter values.

Utility function to determine whether filtering should be applied based on
the presence of actual filter values. Ignores undefined and empty string values.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | `Record`\<`string`, `string` \| `undefined`\> | Object containing filter key-value pairs |

## Returns

`boolean`

True if any filter has a meaningful value, false otherwise

## Example

```typescript
import { FilterTools } from '@fgv/ts-res-ui-components';

const filterValues = { language: 'en-US', platform: '', region: undefined };

if (FilterTools.hasFilterValues(filterValues)) {
  console.log('Has active filters'); // Will print this
  const result = await FilterTools.createFilteredResourceManagerSimple(resources, filterValues);
} else {
  console.log('No filters applied');
}
```
