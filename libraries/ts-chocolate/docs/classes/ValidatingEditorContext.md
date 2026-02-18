[Home](../README.md) > ValidatingEditorContext

# Class: ValidatingEditorContext

Editor context with built-in validating wrapper.
Combines EditorContext with EditorContextValidator for convenient access to both
pre-validated (base) and raw input (validating) methods.
Follows the ValidatingResultMap pattern from ts-utils.

**Extends:** [`EditorContext<T, TBaseId, TId>`](EditorContext.md)

**Implements:** [`IValidatingEditorContext<T, TBaseId, TId>`](../interfaces/IValidatingEditorContext.md)

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[validating](./ValidatingEditorContext.validating.md)

</td><td>

`readonly`

</td><td>

[IEditorContextValidator](../interfaces/IEditorContextValidator.md)&lt;T, TBaseId, TId&gt;

</td><td>

Access validating methods that accept raw input.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[createValidating(params)](./ValidatingEditorContext.createValidating.md)

</td><td>

`static`

</td><td>

Create a new validating editor context.

</td></tr>
<tr><td>

[create(params)](./EditorContext.create.md)

</td><td>

`static`

</td><td>

Create a new editor context.

</td></tr>
<tr><td>

[get(id)](./EditorContext.get.md)

</td><td>



</td><td>

Get entity by ID.

</td></tr>
<tr><td>

[getAll()](./EditorContext.getAll.md)

</td><td>



</td><td>

Get all entities in the collection.

</td></tr>
<tr><td>

[create(baseId, entity)](./EditorContext.create.md)

</td><td>



</td><td>

Create new entity with specified base ID.

</td></tr>
<tr><td>

[updateFromWrapper(id, wrapper)](./EditorContext.updateFromWrapper.md)

</td><td>



</td><td>

Update existing entity from a snapshot provider (e.g.

</td></tr>
<tr><td>

[update(id, entity)](./EditorContext.update.md)

</td><td>



</td><td>

Update existing entity.

</td></tr>
<tr><td>

[delete(id)](./EditorContext.delete.md)

</td><td>



</td><td>

Delete entity from collection.

</td></tr>
<tr><td>

[copyTo(id, targetCollectionId)](./EditorContext.copyTo.md)

</td><td>



</td><td>

Copy entity to another collection.

</td></tr>
<tr><td>

[exists(id)](./EditorContext.exists.md)

</td><td>



</td><td>

Check if entity exists in collection.

</td></tr>
<tr><td>

[validate(entity)](./EditorContext.validate.md)

</td><td>



</td><td>

Validate pre-validated entity using semantic validator.

</td></tr>
<tr><td>

[hasUnsavedChanges()](./EditorContext.hasUnsavedChanges.md)

</td><td>



</td><td>

Check if there are unsaved changes.

</td></tr>
<tr><td>

[clearUnsavedChanges()](./EditorContext.clearUnsavedChanges.md)

</td><td>



</td><td>

Clear the unsaved changes flag.

</td></tr>
</tbody></table>
