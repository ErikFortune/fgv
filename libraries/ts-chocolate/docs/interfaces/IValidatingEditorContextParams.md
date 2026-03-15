[Home](../README.md) > IValidatingEditorContextParams

# Interface: IValidatingEditorContextParams

Parameters for creating a validating editor context.
Extends base editor context params with converter configuration.

**Extends:** [`IEditorContextParams<T, TBaseId, TId>`](IEditorContextParams.md)

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

[entityConverter](./IValidatingEditorContextParams.entityConverter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;T&gt;

</td><td>

Converter for entity validation.

</td></tr>
<tr><td>

[keyConverter](./IValidatingEditorContextParams.keyConverter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;TBaseId&gt;

</td><td>

Converter for base ID validation.

</td></tr>
<tr><td>

[collection](./IEditorContextParams.collection.md)

</td><td>

`readonly`

</td><td>

[EditableCollection](../classes/EditableCollection.md)&lt;T, TBaseId&gt;

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

[getName](./IEditorContextParams.getName.md)

</td><td>

`readonly`

</td><td>

(entity: T) =&gt; string

</td><td>

Function to extract name from entity.

</td></tr>
</tbody></table>
