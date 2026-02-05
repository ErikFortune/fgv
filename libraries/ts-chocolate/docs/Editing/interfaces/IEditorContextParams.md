[Home](../../README.md) > [Editing](../README.md) > IEditorContextParams

# Interface: IEditorContextParams

Parameters for creating a base editor context.
The base context accepts pre-validated entities and base IDs.
For raw input handling, use ValidatingEditorContext.

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

[collection](./IEditorContextParams.collection.md)

</td><td>

`readonly`

</td><td>

[EditableCollection](../../classes/EditableCollection.md)&lt;T, TBaseId&gt;

</td><td>

The mutable collection to edit.

</td></tr>
<tr><td>

[semanticValidator](./IEditorContextParams.semanticValidator.md)

</td><td>

`readonly`

</td><td>

(entity: T) =&gt; Result&lt;T&gt;

</td><td>

Optional semantic validator for cross-field and business rules.

</td></tr>
<tr><td>

[createId](./IEditorContextParams.createId.md)

</td><td>

`readonly`

</td><td>

Converter&lt;TId&gt;

</td><td>

Converter used to create a composite ID from a `{ collectionId, itemId }` object.

</td></tr>
<tr><td>

[getBaseId](./IEditorContextParams.getBaseId.md)

</td><td>

`readonly`

</td><td>

(entity: T) =&gt; TBaseId | undefined

</td><td>

Function to extract base ID from entity.

</td></tr>
<tr><td>

[getName](./IEditorContextParams.getName.md)

</td><td>

`readonly`

</td><td>

(entity: T) =&gt; string

</td><td>

Function to extract name from entity.

</td></tr>
</tbody></table>
