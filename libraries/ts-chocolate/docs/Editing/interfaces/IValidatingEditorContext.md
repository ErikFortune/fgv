[Home](../../README.md) > [Editing](../README.md) > IValidatingEditorContext

# Interface: IValidatingEditorContext

Editor context with validating wrapper access.
Combines base editor context with a validating property for raw input handling.

**Extends:** [`IEditorContext<T, TBaseId, TId>`](../../interfaces/IEditorContext.md)

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

[validating](./IValidatingEditorContext.validating.md)

</td><td>

`readonly`

</td><td>

[IEditorContextValidator](../../interfaces/IEditorContextValidator.md)&lt;T, TBaseId, TId&gt;

</td><td>

Access validating methods that accept raw input.

</td></tr>
<tr><td>

[get](./IEditorContext.get.md)

</td><td>

`readonly`

</td><td>

(id: TId) =&gt; Result&lt;T&gt;

</td><td>

Get entity by ID.

</td></tr>
<tr><td>

[getAll](./IEditorContext.getAll.md)

</td><td>

`readonly`

</td><td>

() =&gt; readonly [TId, T][]

</td><td>

Get all entities in the collection.

</td></tr>
<tr><td>

[create](./IEditorContext.create.md)

</td><td>

`readonly`

</td><td>

(baseId: TBaseId | undefined, entity: T) =&gt; Result&lt;TId&gt;

</td><td>

Create new entity with specified base ID.

</td></tr>
<tr><td>

[update](./IEditorContext.update.md)

</td><td>

`readonly`

</td><td>

(id: TId, entity: T) =&gt; Result&lt;T&gt;

</td><td>

Update existing entity.

</td></tr>
<tr><td>

[delete](./IEditorContext.delete.md)

</td><td>

`readonly`

</td><td>

(id: TId) =&gt; Result&lt;T&gt;

</td><td>

Delete entity from collection.

</td></tr>
<tr><td>

[copyTo](./IEditorContext.copyTo.md)

</td><td>

`readonly`

</td><td>

(id: TId, targetCollectionId: [CollectionId](../../type-aliases/CollectionId.md)) =&gt; Result&lt;TId&gt;

</td><td>

Copy entity to another collection.

</td></tr>
<tr><td>

[exists](./IEditorContext.exists.md)

</td><td>

`readonly`

</td><td>

(id: TId) =&gt; boolean

</td><td>

Check if entity exists in collection.

</td></tr>
<tr><td>

[validate](./IEditorContext.validate.md)

</td><td>

`readonly`

</td><td>

(entity: T) =&gt; Result&lt;[IValidationReport](../../interfaces/IValidationReport.md)&gt;

</td><td>

Validate pre-validated entity using semantic validator.

</td></tr>
<tr><td>

[hasUnsavedChanges](./IEditorContext.hasUnsavedChanges.md)

</td><td>

`readonly`

</td><td>

() =&gt; boolean

</td><td>

Check if there are unsaved changes.

</td></tr>
<tr><td>

[clearUnsavedChanges](./IEditorContext.clearUnsavedChanges.md)

</td><td>

`readonly`

</td><td>

() =&gt; void

</td><td>

Clear the unsaved changes flag.

</td></tr>
</tbody></table>
