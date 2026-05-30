[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [FilterTools](../README.md) / IFilterState

# Interface: IFilterState

Represents the current state of resource filtering.
Tracks filter configuration, values, and application state.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="appliedvalues"></a> `appliedValues` | `Record`\<`string`, `string` \| `undefined`\> | Filter values that have been applied to the resource manager |
| <a id="enabled"></a> `enabled` | `boolean` | Whether filtering is currently enabled |
| <a id="haspendingchanges"></a> `hasPendingChanges` | `boolean` | Whether there are unsaved changes in the filter values |
| <a id="reducequalifiers"></a> `reduceQualifiers` | `boolean` | Whether to reduce qualifiers when filtering (removes unused qualifier dimensions) |
| <a id="values"></a> `values` | `Record`\<`string`, `string` \| `undefined`\> | Current filter values being edited (not yet applied) |
