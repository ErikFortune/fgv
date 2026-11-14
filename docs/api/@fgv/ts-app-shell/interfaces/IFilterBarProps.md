[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IFilterBarProps

# Interface: IFilterBarProps

Props for the FilterBar component.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-activefiltercount"></a> `activeFilterCount` | `readonly` | `number` | Total number of active filters across all filter rows |
| <a id="property-children"></a> `children` | `readonly` | `ReactNode` | Filter row children (FilterRow components) |
| <a id="property-onclearall"></a> `onClearAll` | `readonly` | () => `void` | Callback to clear all filters (search + all filter rows) |
| <a id="property-search"></a> `search` | `readonly` | [`ISearchBarProps`](ISearchBarProps.md) | Search bar props |
