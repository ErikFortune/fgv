<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json](./ts-json.md) &gt; [JsonEditor](./ts-json.jsoneditor.md)

## JsonEditor class

A [JsonEditor](./ts-json.jsoneditor.md) can be used to edit JSON objects in place or to clone any JSON value, applying a default context and optional set of editor rules that were supplied at initialization.

**Signature:**

```typescript
export declare class JsonEditor implements IJsonCloneEditor 
```
**Implements:** [IJsonCloneEditor](./ts-json.ijsoncloneeditor.md)

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `JsonEditor` class.

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
<tbody><tr><td>

[default](./ts-json.jsoneditor.default.md)


</td><td>

`static`

`readonly`


</td><td>

[JsonEditor](./ts-json.jsoneditor.md)


</td><td>

Default singleton [JsonEditor](./ts-json.jsoneditor.md) for simple use. Applies all rules but with no default context.


</td></tr>
<tr><td>

[options](./ts-json.jsoneditor.options.md)


</td><td>


</td><td>

[IJsonEditorOptions](./ts-json.ijsoneditoroptions.md)


</td><td>

Full set of [editor options](./ts-json.ijsoneditoroptions.md) in effect for this editor.


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
<tbody><tr><td>

[clone(src, context)](./ts-json.jsoneditor.clone.md)


</td><td>


</td><td>

Deep clones a supplied `JsonValue`<!-- -->, applying all editor rules and a default or optionally supplied context


</td></tr>
<tr><td>

[create(options, rules)](./ts-json.jsoneditor.create.md)


</td><td>

`static`


</td><td>

Constructs a new [JsonEditor](./ts-json.jsoneditor.md)<!-- -->.


</td></tr>
<tr><td>

[getDefaultRules(options)](./ts-json.jsoneditor.getdefaultrules.md)


</td><td>

`static`


</td><td>

Gets the default set of rules to be applied for a given set of options. By default, all available rules (templates, conditionals, multi-value and references) are applied.


</td></tr>
<tr><td>

[mergeObjectInPlace(target, src, runtimeContext)](./ts-json.jsoneditor.mergeobjectinplace.md)


</td><td>


</td><td>

Merges a supplied source object into a supplied target, updating the target object.


</td></tr>
<tr><td>

[mergeObjectsInPlace(target, srcObjects)](./ts-json.jsoneditor.mergeobjectsinplace.md)


</td><td>


</td><td>

Merges multiple supplied source objects into a supplied target, updating the target object and using the default context supplied at creation time.


</td></tr>
<tr><td>

[mergeObjectsInPlaceWithContext(context, base, srcObjects)](./ts-json.jsoneditor.mergeobjectsinplacewithcontext.md)


</td><td>


</td><td>

Merges multiple supplied source objects into a supplied target, updating the target object and using an optional [context](./ts-json.ijsoncontext.md) supplied in the call.


</td></tr>
</tbody></table>
