[Home](../README.md) > TemplatedJsonConverter

# Class: TemplatedJsonConverter

An @fgv/ts-utils `Converter` from `unknown` to type-safe JSON
with mustache template rendering and multi-value property name rules enabled
regardless of initial context.

**Extends:** [`JsonEditorConverter`](JsonEditorConverter.md)

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor(options)`

</td><td>



</td><td>

Constructs a new TemplatedJsonConverter | TemplatedJsonConverter with
supplied or default options.

</td></tr>
</tbody></table>

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

[templateOptions](./TemplatedJsonConverter.templateOptions.md)

</td><td>

`readonly` `static`

</td><td>

Partial&lt;[IJsonConverterOptions](../interfaces/IJsonConverterOptions.md)&gt;

</td><td>

Default IJsonConverterOptions | JSON converter options

</td></tr>
<tr><td>

[editor](./JsonEditorConverter.editor.md)

</td><td>

`readonly`

</td><td>

[JsonEditor](JsonEditor.md)

</td><td>



</td></tr>
<tr><td>

[isOptional](./JsonEditorConverter.isOptional.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Converter.isOptional

</td></tr>
<tr><td>

[brand](./JsonEditorConverter.brand.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Converter.brand

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

[create(options)](./TemplatedJsonConverter.create.md)

</td><td>

`static`

</td><td>

Constructs a new TemplatedJsonConverter | TemplatedJsonConverter with

</td></tr>
<tr><td>

[createWithEditor(editor)](./JsonEditorConverter.createWithEditor.md)

</td><td>

`static`

</td><td>

Constructs a new JsonEditor | JsonEditorConverter which uses the supplied editor

</td></tr>
<tr><td>

[object()](./JsonEditorConverter.object.md)

</td><td>



</td><td>

Gets a derived converter which fails if the resulting converted

</td></tr>
<tr><td>

[array()](./JsonEditorConverter.array.md)

</td><td>



</td><td>

Gets a derived converter which fails if the resulting converted

</td></tr>
<tr><td>

[convert(from, context)](./JsonEditorConverter.convert.md)

</td><td>



</td><td>

Converter.convert

</td></tr>
<tr><td>

[convertOptional(from, context, onError)](./JsonEditorConverter.convertOptional.md)

</td><td>



</td><td>

Converter.convertOptional

</td></tr>
<tr><td>

[optional(onError)](./JsonEditorConverter.optional.md)

</td><td>



</td><td>

Converter.optional

</td></tr>
<tr><td>

[map(mapper)](./JsonEditorConverter.map.md)

</td><td>



</td><td>

Converter.map

</td></tr>
<tr><td>

[mapConvert(mapConverter)](./JsonEditorConverter.mapConvert.md)

</td><td>



</td><td>

Converter.mapConvert

</td></tr>
<tr><td>

[mapItems(mapper)](./JsonEditorConverter.mapItems.md)

</td><td>



</td><td>

Converter.mapItems

</td></tr>
<tr><td>

[mapConvertItems(mapConverter)](./JsonEditorConverter.mapConvertItems.md)

</td><td>



</td><td>

Converter.mapConvertItems

</td></tr>
<tr><td>

[withAction(action)](./JsonEditorConverter.withAction.md)

</td><td>



</td><td>

Converter.withAction

</td></tr>
<tr><td>

[withTypeGuard(guard, message)](./JsonEditorConverter.withTypeGuard.md)

</td><td>



</td><td>

Converter.withTypeGuard

</td></tr>
<tr><td>

[withItemTypeGuard(guard, message)](./JsonEditorConverter.withItemTypeGuard.md)

</td><td>



</td><td>

Converter.withItemTypeGuard

</td></tr>
<tr><td>

[withConstraint(constraint, options)](./JsonEditorConverter.withConstraint.md)

</td><td>



</td><td>

Converter.withConstraint

</td></tr>
<tr><td>

[withBrand(brand)](./JsonEditorConverter.withBrand.md)

</td><td>



</td><td>

Converter.withBrand

</td></tr>
<tr><td>

[withDefault(defaultValue)](./JsonEditorConverter.withDefault.md)

</td><td>



</td><td>

Converter.withDefault

</td></tr>
<tr><td>

[or(other)](./JsonEditorConverter.or.md)

</td><td>



</td><td>

Chains this converter with another of the same type, to be attempted if this

</td></tr>
<tr><td>

[withFormattedError(formatter)](./JsonEditorConverter.withFormattedError.md)

</td><td>



</td><td>

Converter.withFormattedError

</td></tr>
</tbody></table>
