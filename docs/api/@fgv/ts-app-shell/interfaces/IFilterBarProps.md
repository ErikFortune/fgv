[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IFilterBarProps

# Interface: IFilterBarProps

Props for the FilterBar component.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="activefiltercount"></a> `activeFilterCount` | `readonly` | `number` | Total number of active filters across all filter rows |
| <a id="children"></a> `children` | `readonly` | `ReactNode` | Filter row children (FilterRow components) |
| <a id="onclearall"></a> `onClearAll` | `readonly` | () => `void` | Callback to clear all filters (search + all filter rows) |
| <a id="search"></a> `search` | `readonly` | [`ISearchBarProps`](ISearchBarProps.md) | Search bar props |
