[Home](../../README.md) > [Procedures](../README.md) > ProcedureEditorContext

# Class: ProcedureEditorContext

Editor context specialized for procedure entities.

**Extends:** [`ValidatingEditorContext<IProcedureEntity, BaseProcedureId, ProcedureId>`](../../classes/ValidatingEditorContext.md)

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

[IEditorContextValidator](../../interfaces/IEditorContextValidator.md)&lt;T, TBaseId, TId&gt;

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

[createFromCollection(collection)](./ProcedureEditorContext.createFromCollection.md)

</td><td>

`static`

</td><td>

Create a procedure editor context from a collection.

</td></tr>
<tr><td>

[createValidating(params)](./ValidatingEditorContext.createValidating.md)

</td><td>

`static`

</td><td>

Create a new validating editor context.

</td></tr>
<tr><td>

[create(params)](./ValidatingEditorContext.create.md)

</td><td>

`static`

</td><td>

Create a new editor context.

</td></tr>
<tr><td>

[get(id)](./ValidatingEditorContext.get.md)

</td><td>



</td><td>

Get entity by ID.

</td></tr>
<tr><td>

[getAll()](./ValidatingEditorContext.getAll.md)

</td><td>



</td><td>

Get all entities in the collection.

</td></tr>
<tr><td>

[create(baseId, entity)](./ValidatingEditorContext.create.md)

</td><td>



</td><td>

Create new entity with specified base ID.

</td></tr>
<tr><td>

[updateFromWrapper(id, wrapper)](./ValidatingEditorContext.updateFromWrapper.md)

</td><td>



</td><td>

Update existing entity from a snapshot provider (e.g.

</td></tr>
<tr><td>

[update(id, entity)](./ValidatingEditorContext.update.md)

</td><td>



</td><td>

Update existing entity.

</td></tr>
<tr><td>

[delete(id)](./ValidatingEditorContext.delete.md)

</td><td>



</td><td>

Delete entity from collection.

</td></tr>
<tr><td>

[copyTo(id, targetCollectionId)](./ValidatingEditorContext.copyTo.md)

</td><td>



</td><td>

Copy entity to another collection.

</td></tr>
<tr><td>

[exists(id)](./ValidatingEditorContext.exists.md)

</td><td>



</td><td>

Check if entity exists in collection.

</td></tr>
<tr><td>

[validate(entity)](./ValidatingEditorContext.validate.md)

</td><td>



</td><td>

Validate pre-validated entity using semantic validator.

</td></tr>
<tr><td>

[hasUnsavedChanges()](./ValidatingEditorContext.hasUnsavedChanges.md)

</td><td>



</td><td>

Check if there are unsaved changes.

</td></tr>
<tr><td>

[clearUnsavedChanges()](./ValidatingEditorContext.clearUnsavedChanges.md)

</td><td>



</td><td>

Clear the unsaved changes flag.

</td></tr>
</tbody></table>
