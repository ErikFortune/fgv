[Home](../README.md) > Editing

# Namespace: Editing

Generic editing framework for entity collections.
Provides CRUD operations, validation, and export/import functionality.

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Ingredients](./Ingredients/README.md)

</td><td>

Ingredient editing - specialized editing functionality for ingredients

</td></tr>
<tr><td>

[Molds](./Molds/README.md)

</td><td>

Mold editing - specialized editing functionality for molds

</td></tr>
<tr><td>

[Tasks](./Tasks/README.md)

</td><td>

Task editing - specialized editing functionality for tasks

</td></tr>
<tr><td>

[Procedures](./Procedures/README.md)

</td><td>

Procedure editing - specialized editing functionality for procedures

</td></tr>
<tr><td>

[Decorations](./Decorations/README.md)

</td><td>

Decoration editing - specialized editing functionality for decorations

</td></tr>
</tbody></table>

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ValidationReport](./classes/ValidationReport.md)

</td><td>

Implementation of IValidationReport.

</td></tr>
<tr><td>

[ValidationReportBuilder](./classes/ValidationReportBuilder.md)

</td><td>

Builder for constructing validation reports.

</td></tr>
<tr><td>

[EditableCollection](./classes/EditableCollection.md)

</td><td>

An extension of ValidatingResultMap that adds collection metadata,
mutability control, and export functionality for entity editing workflows.

</td></tr>
<tr><td>

[CollectionManager](./classes/CollectionManager.md)

</td><td>

Implementation of collection management operations.

</td></tr>
<tr><td>

[EditorContext](./classes/EditorContext.md)

</td><td>

Base implementation of IEditorContext.

</td></tr>
<tr><td>

[EditorContextValidator](./classes/EditorContextValidator.md)

</td><td>

Validating wrapper for EditorContext.

</td></tr>
<tr><td>

[ValidatingEditorContext](./classes/ValidatingEditorContext.md)

</td><td>

Editor context with built-in validating wrapper.

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

[IEditorContext](./interfaces/IEditorContext.md)

</td><td>

Generic editor context for entity collections.

</td></tr>
<tr><td>

[IEditorContextValidator](./interfaces/IEditorContextValidator.md)

</td><td>

Validating wrapper interface for editor context.

</td></tr>
<tr><td>

[IValidatingEditorContext](./interfaces/IValidatingEditorContext.md)

</td><td>

Editor context with validating wrapper access.

</td></tr>
<tr><td>

[IValidationReport](./interfaces/IValidationReport.md)

</td><td>

Validation report with detailed field-level errors.

</td></tr>
<tr><td>

[IEditableCollection](./interfaces/IEditableCollection.md)

</td><td>

Editable collection wrapper.

</td></tr>
<tr><td>

[ICollectionManager](./interfaces/ICollectionManager.md)

</td><td>

Manager for collection-level CRUD operations.

</td></tr>
<tr><td>

[IExportOptions](./interfaces/IExportOptions.md)

</td><td>

Options for exporting collections.

</td></tr>
<tr><td>

[IImportOptions](./interfaces/IImportOptions.md)

</td><td>

Options for importing collections.

</td></tr>
<tr><td>

[IEditableCollectionParams](./interfaces/IEditableCollectionParams.md)

</td><td>

Parameters for creating an editable collection.

</td></tr>
<tr><td>

[IEditorContextParams](./interfaces/IEditorContextParams.md)

</td><td>

Parameters for creating a base editor context.

</td></tr>
<tr><td>

[IEditorContextValidatorParams](./interfaces/IEditorContextValidatorParams.md)

</td><td>

Parameters for creating an editor context validator.

</td></tr>
<tr><td>

[IValidatingEditorContextParams](./interfaces/IValidatingEditorContextParams.md)

</td><td>

Parameters for creating a validating editor context.

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

[isValidationSuccess](./functions/isValidationSuccess.md)

</td><td>

Check if validation report indicates success.

</td></tr>
</tbody></table>
