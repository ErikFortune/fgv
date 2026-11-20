[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / ICascadeContainerProps

# Interface: ICascadeContainerProps

Props for the CascadeContainer component.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-columns"></a> `columns` | `readonly` | readonly [`ICascadeColumn`](ICascadeColumn.md)[] | Ordered columns (left-to-right) |
| <a id="property-mincolumnwidth"></a> `minColumnWidth?` | `readonly` | `string` | Minimum column width in CSS units (default: '400px') |
| <a id="property-onfocus"></a> `onFocus?` | `readonly` | () => `void` | Callback when the user clicks inside a cascade column (signals list should collapse) |
| <a id="property-onpopto"></a> `onPopTo` | `readonly` | (`depth`) => `void` | Callback to pop the cascade back to a specific depth (0 = clear all) |
| <a id="property-rootlabel"></a> `rootLabel?` | `readonly` | `string` | Label for the breadcrumb root link (default: 'List') |
