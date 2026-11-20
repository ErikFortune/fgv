[Home](../README.md) > GridTools

# Namespace: GridTools

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ResourceSelector](./classes/ResourceSelector.md)

</td><td>

Resource selector utility for filtering resources based on various criteria.

</td></tr>
<tr><td>

[GridValidationState](./classes/GridValidationState.md)

</td><td>

Grid validation state management utility.

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IGridViewProps](./interfaces/IGridViewProps.md)

</td><td>

Props for the GridView component.

</td></tr>
<tr><td>

[IMultiGridViewProps](./interfaces/IMultiGridViewProps.md)

</td><td>

Props for the MultiGridView component.

</td></tr>
<tr><td>

[IGridViewInitParams](./interfaces/IGridViewInitParams.md)

</td><td>

Configuration for a single grid instance.

</td></tr>
<tr><td>

[IGridColumnDefinition](./interfaces/IGridColumnDefinition.md)

</td><td>

Configuration for a single column in a resource grid.

</td></tr>
<tr><td>

[IGridDropdownOption](./interfaces/IGridDropdownOption.md)

</td><td>

Dropdown option for cell editing.

</td></tr>
<tr><td>

[IGridCellValidation](./interfaces/IGridCellValidation.md)

</td><td>

Validation configuration for grid cells.

</td></tr>
<tr><td>

[ICustomResourceSelector](./interfaces/ICustomResourceSelector.md)

</td><td>

Custom resource selector for advanced filtering logic.

</td></tr>
<tr><td>

[IGridPresentationOptions](./interfaces/IGridPresentationOptions.md)

</td><td>

Presentation options for grid display.

</td></tr>
<tr><td>

[IResourceTypeColumnMapping](./interfaces/IResourceTypeColumnMapping.md)

</td><td>

Column mapping configuration for a specific resource type.

</td></tr>
<tr><td>

[IGridCellProps](./interfaces/IGridCellProps.md)

</td><td>

Props passed to custom grid cell renderers.

</td></tr>
<tr><td>

[IGridCellEditorProps](./interfaces/IGridCellEditorProps.md)

</td><td>

Props passed to custom grid cell editors.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[GridResourceSelector](./type-aliases/GridResourceSelector.md)

</td><td>

Resource selection configuration for grid views.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[selectResources](./functions/selectResources.md)

</td><td>

Utility function to select resources using the default selector.

</td></tr>
<tr><td>

[validateCellValue](./functions/validateCellValue.md)

</td><td>

Validates a cell value according to the column's validation rules.

</td></tr>
<tr><td>

[hasGridValidationErrors](./functions/hasGridValidationErrors.md)

</td><td>

Utility function to check if the grid has validation errors.

</td></tr>
<tr><td>

[getAllGridValidationErrors](./functions/getAllGridValidationErrors.md)

</td><td>

Utility function to get all current validation errors.

</td></tr>
<tr><td>

[clearAllGridValidationErrors](./functions/clearAllGridValidationErrors.md)

</td><td>

Utility function to clear all grid validation errors.

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ResourceGrid](./variables/ResourceGrid.md)

</td><td>

Main ResourceGrid component for displaying resources in a table format.

</td></tr>
<tr><td>

[EditableGridCell](./variables/EditableGridCell.md)

</td><td>

EditableGridCell component that provides editing capabilities for grid cells.

</td></tr>
<tr><td>

[SharedContextControls](./variables/SharedContextControls.md)

</td><td>

SharedContextControls component for managing resolution context across multiple grids.

</td></tr>
<tr><td>

[GridSelector](./variables/GridSelector.md)

</td><td>

GridSelector component for switching between multiple grid configurations.

</td></tr>
<tr><td>

[StringCell](./variables/StringCell.md)

</td><td>

StringCell component for editing string values with validation.

</td></tr>
<tr><td>

[BooleanCell](./variables/BooleanCell.md)

</td><td>

BooleanCell component for editing boolean values with checkbox presentation.

</td></tr>
<tr><td>

[TriStateCell](./variables/TriStateCell.md)

</td><td>

TriStateCell component for editing three-state boolean values.

</td></tr>
<tr><td>

[DropdownCell](./variables/DropdownCell.md)

</td><td>

DropdownCell component for editing string values with predefined options.

</td></tr>
<tr><td>

[defaultResourceSelector](./variables/defaultResourceSelector.md)

</td><td>

Default resource selector instance for use throughout the application.

</td></tr>
<tr><td>

[ValidationPatterns](./variables/ValidationPatterns.md)

</td><td>

Common validation patterns for reuse.

</td></tr>
<tr><td>

[ValidationFunctions](./variables/ValidationFunctions.md)

</td><td>

Common validation functions for reuse.

</td></tr>
</tbody></table>
