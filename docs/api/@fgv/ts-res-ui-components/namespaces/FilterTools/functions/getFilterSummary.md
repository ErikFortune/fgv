[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [FilterTools](../README.md) / getFilterSummary

# Function: getFilterSummary()

> **getFilterSummary**(`values`): `string`

Creates a human-readable summary string of active filter values.

Generates a comma-separated string representation of all non-empty filter values,
useful for displaying current filter state to users or in debug output.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | `Record`\<`string`, `string` \| `undefined`\> | Object containing filter key-value pairs |

## Returns

`string`

Human-readable string summarizing active filters

## Example

```typescript
import { FilterTools } from '@fgv/ts-res-ui-components';

const filterValues = {
  language: 'en-US',
  platform: 'web',
  region: '',
  theme: undefined
};

const summary = FilterTools.getFilterSummary(filterValues);
console.log(summary); // "language=en-US, platform=web"

// For empty filters
const emptyFilters = {};
console.log(FilterTools.getFilterSummary(emptyFilters)); // "No filters"
```
