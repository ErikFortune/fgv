[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [FilterTools](../README.md) / IFilterActions

# Interface: IFilterActions

Actions available for managing filter state.
Provides methods for updating all aspects of resource filtering.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-applyfiltervalues"></a> `applyFilterValues` | () => `void` | Apply current filter values to create a filtered resource manager |
| <a id="property-resetfiltervalues"></a> `resetFilterValues` | () => `void` | Reset filter values to their applied state (discards pending changes) |
| <a id="property-updatefilterenabled"></a> `updateFilterEnabled` | (`enabled`) => `void` | Enable or disable filtering |
| <a id="property-updatefiltervalues"></a> `updateFilterValues` | (`values`) => `void` | Update filter values (does not apply them until applyFilterValues is called) |
| <a id="property-updatereducequalifiers"></a> `updateReduceQualifiers` | (`reduceQualifiers`) => `void` | Enable or disable qualifier reduction during filtering |
