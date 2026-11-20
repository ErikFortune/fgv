[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IEntityTabLayoutProps

# Interface: IEntityTabLayoutProps

Props for the EntityTabLayout component.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-cascadecolumns"></a> `cascadeColumns` | `readonly` | readonly [`ICascadeColumn`](ICascadeColumn.md)[] | Cascade columns to display (empty array = no cascade) |
| <a id="property-comparemode"></a> `compareMode?` | `readonly` | `boolean` | Whether compare mode is active |
| <a id="property-comparisoncolumns"></a> `comparisonColumns?` | `readonly` | readonly [`IComparisonColumn`](IComparisonColumn.md)[] | Columns for the comparison view (when compare mode is active with 2+ selections) |
| <a id="property-list"></a> `list` | `readonly` | `ReactNode` | The entity list content (rendered in the collapsible left panel) |
| <a id="property-listcollapsed"></a> `listCollapsed` | `readonly` | `boolean` | Whether the entity list is currently collapsed |
| <a id="property-onexitcomparison"></a> `onExitComparison?` | `readonly` | () => `void` | Callback to exit the comparison view (back to selection list) |
| <a id="property-onexitvariationcompare"></a> `onExitVariationCompare?` | `readonly` | () => `void` | Callback to exit variation comparison mode |
| <a id="property-onlistcollapse"></a> `onListCollapse` | `readonly` | () => `void` | Callback to collapse the entity list (fired when user clicks inside cascade) |
| <a id="property-onpopto"></a> `onPopTo` | `readonly` | (`depth`) => `void` | Callback to pop the cascade back to a specific depth (0 = clear all) |
| <a id="property-showingcomparison"></a> `showingComparison?` | `readonly` | `boolean` | Whether the comparison view is actively showing (user explicitly triggered) |
| <a id="property-variationcomparecolumns"></a> `variationCompareColumns?` | `readonly` | readonly [`IComparisonColumn`](IComparisonColumn.md)[] | Columns for variation comparison (when comparing variations of a single recipe) |
