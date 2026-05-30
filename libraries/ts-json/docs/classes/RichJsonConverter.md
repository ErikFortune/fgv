[Home](../README.md) > RichJsonConverter

# Class: RichJsonConverter

A @fgv/ts-utils `Converter` from `unknown` to type-safe JSON with mustache
template rendering, multi-value property name, conditional property
name, and external reference rules enabled regardless of initial context.

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

Constructs a new RichJsonConverter | RichJsonConverter with supplied or
default options.

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

[richOptions](./RichJsonConverter.richOptions.md)

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

Indicates whether this element is explicitly optional.

</td></tr>
<tr><td>

[brand](./JsonEditorConverter.brand.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Returns the brand for a branded type.

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

[create(options)](./RichJsonConverter.create.md)

</td><td>

`static`

</td><td>

Constructs a new RichJsonConverter | RichJsonConverter with supplied or

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

Converts from `unknown` to `<T>`.

</td></tr>
<tr><td>

[convertOptional(from, context, onError)](./JsonEditorConverter.convertOptional.md)

</td><td>



</td><td>

Converts from `unknown` to `<T>` or `undefined`, as appropriate.

</td></tr>
<tr><td>

[optional(onError)](./JsonEditorConverter.optional.md)

</td><td>



</td><td>

Creates a Converter for an optional value.

</td></tr>
<tr><td>

[map(mapper)](./JsonEditorConverter.map.md)

</td><td>



</td><td>

Creates a Converter which applies a (possibly) mapping conversion to

</td></tr>
<tr><td>

[mapConvert(mapConverter)](./JsonEditorConverter.mapConvert.md)

</td><td>



</td><td>

Creates a Converter which applies an additional supplied

</td></tr>
<tr><td>

[mapItems(mapper)](./JsonEditorConverter.mapItems.md)

</td><td>



</td><td>

Creates a Converter which maps the individual items of a collection

</td></tr>
<tr><td>

[mapConvertItems(mapConverter)](./JsonEditorConverter.mapConvertItems.md)

</td><td>



</td><td>

Creates a Converter which maps the individual items of a collection

</td></tr>
<tr><td>

[withAction(action)](./JsonEditorConverter.withAction.md)

</td><td>



</td><td>

Creates a Converter | Converter which applies a supplied action after
conversion.

</td></tr>
<tr><td>

[withTypeGuard(guard, message)](./JsonEditorConverter.withTypeGuard.md)

</td><td>



</td><td>

Creates a Converter which applies a supplied type guard to the conversion

</td></tr>
<tr><td>

[withItemTypeGuard(guard, message)](./JsonEditorConverter.withItemTypeGuard.md)

</td><td>



</td><td>

Creates a Converter which applies a supplied type guard to each member of

</td></tr>
<tr><td>

[withConstraint(constraint, options)](./JsonEditorConverter.withConstraint.md)

</td><td>



</td><td>

Creates a Converter which applies an optional constraint to the result
of this conversion.

</td></tr>
<tr><td>

[withBrand(brand)](./JsonEditorConverter.withBrand.md)

</td><td>



</td><td>

Returns a converter which adds a brand to the type to prevent mismatched usage

</td></tr>
<tr><td>

[withDefault(defaultValue)](./JsonEditorConverter.withDefault.md)

</td><td>



</td><td>

Returns a Converter which always succeeds with a default value rather than failing.

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

Creates a new Converter which is derived from this one but which returns an

</td></tr>
</tbody></table>
