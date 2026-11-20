[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / IGridColumnDefinition

# Interface: IGridColumnDefinition

Configuration for a single column in a resource grid.
Defines how to extract, display, and edit values from resolved resources.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-allowcustomvalue"></a> `allowCustomValue?` | `boolean` | Whether to allow custom values in dropdown (combobox behavior) |
| <a id="property-celleditor"></a> `cellEditor?` | `ComponentType`\<[`IGridCellEditorProps`](IGridCellEditorProps.md)\> | Custom component for editing cell content |
| <a id="property-cellrenderer"></a> `cellRenderer?` | `ComponentType`\<[`IGridCellProps`](IGridCellProps.md)\> | Custom component for rendering cell content |
| <a id="property-celltype"></a> `cellType?` | `"string"` \| `"boolean"` \| `"custom"` \| `"tristate"` \| `"dropdown"` | Type of cell editor to use |
| <a id="property-datapath"></a> `dataPath` | `string` \| `string`[] | Path to the property in the resolved resource value (JSONPath-like) |
| <a id="property-dropdownoptions"></a> `dropdownOptions?` | [`IGridDropdownOption`](IGridDropdownOption.md)[] \| (() => `Promise`\<[`IGridDropdownOption`](IGridDropdownOption.md)[]\>) | Options for dropdown/combobox cells |
| <a id="property-editable"></a> `editable?` | `boolean` | Whether values in this column can be edited |
| <a id="property-id"></a> `id` | `string` | Unique identifier for this column |
| <a id="property-sortable"></a> `sortable?` | `boolean` | Whether this column can be sorted |
| <a id="property-title"></a> `title` | `string` | Display title for the column header |
| <a id="property-tristatelabels"></a> `triStateLabels?` | `object` | Custom labels for tristate values |
| `triStateLabels.falseLabel` | `string` | - |
| `triStateLabels.trueLabel` | `string` | - |
| `triStateLabels.undefinedLabel` | `string` | - |
| <a id="property-tristatepresentation"></a> `triStatePresentation?` | `"checkbox"` \| `"dropdown"` | Presentation mode for tristate cells |
| <a id="property-validation"></a> `validation?` | [`IGridCellValidation`](IGridCellValidation.md) | Validation configuration for this column |
| <a id="property-width"></a> `width?` | `number` | Optional fixed width for the column |
