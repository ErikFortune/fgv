[Home](../README.md) > JsonEditor

# Class: JsonEditor

A JsonEditor | JsonEditor can be used to edit JSON objects in place or to
clone any JSON value, applying a default context and optional set of editor rules that
were supplied at initialization.

**Implements:** [`IJsonCloneEditor`](../interfaces/IJsonCloneEditor.md)

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

[options](./JsonEditor.options.md)

</td><td>



</td><td>

[IJsonEditorOptions](../interfaces/IJsonEditorOptions.md)

</td><td>

Full set of IJsonEditorOptions | editor options in effect for this editor.

</td></tr>
<tr><td>

[default](./JsonEditor.default.md)

</td><td>

`readonly` `static`

</td><td>

[JsonEditor](JsonEditor.md)

</td><td>

Default singleton JsonEditor | JsonEditor for simple use.

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

[create(options, rules)](./JsonEditor.create.md)

</td><td>

`static`

</td><td>

Constructs a new JsonEditor | JsonEditor.

</td></tr>
<tr><td>

[getDefaultRules(options)](./JsonEditor.getDefaultRules.md)

</td><td>

`static`

</td><td>

Gets the default set of rules to be applied for a given set of options.

</td></tr>
<tr><td>

[mergeObjectInPlace(target, src, runtimeContext)](./JsonEditor.mergeObjectInPlace.md)

</td><td>



</td><td>

Merges a supplied source object into a supplied target, updating the target object.

</td></tr>
<tr><td>

[mergeObjectsInPlace(target, srcObjects)](./JsonEditor.mergeObjectsInPlace.md)

</td><td>



</td><td>

Merges multiple supplied source objects into a supplied target, updating the target

</td></tr>
<tr><td>

[mergeObjectsInPlaceWithContext(context, base, srcObjects)](./JsonEditor.mergeObjectsInPlaceWithContext.md)

</td><td>



</td><td>

Merges multiple supplied source objects into a supplied target, updating the target

</td></tr>
<tr><td>

[clone(src, context)](./JsonEditor.clone.md)

</td><td>



</td><td>

Deep clones a supplied `JsonValue`, applying all editor rules and a default

</td></tr>
</tbody></table>
