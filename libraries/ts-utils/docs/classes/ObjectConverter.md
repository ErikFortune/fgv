[Home](../README.md) > ObjectConverter

# Class: ObjectConverter

A Converter | Converter which converts an object of type `<T>` without changing shape, given
a Conversion.FieldConverters | FieldConverters<T> for the fields in the object.

**Extends:** [`BaseConverter<T, TC>`](BaseConverter.md)

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

[fields](./ObjectConverter.fields.md)

</td><td>

`readonly`

</td><td>

[FieldConverters](../type-aliases/FieldConverters.md)&lt;T, TC&gt;

</td><td>

Fields converted by this Conversion.ObjectConverter | ObjectConverter.

</td></tr>
<tr><td>

[options](./ObjectConverter.options.md)

</td><td>

`readonly`

</td><td>

[ObjectConverterOptions](../interfaces/ObjectConverterOptions.md)&lt;T&gt;

</td><td>

Options used to initialize this Conversion.ObjectConverter | ObjectConverter.

</td></tr>
<tr><td>

[isOptional](./BaseConverter.isOptional.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates whether this element is explicitly optional.

</td></tr>
<tr><td>

[brand](./BaseConverter.brand.md)

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

[convertPartial(from, context)](./ObjectConverter.convertPartial.md)

</td><td>



</td><td>

Converts the supplied object using the Conversion.ObjectConverter | ObjectConverter

</td></tr>
<tr><td>

[convertRequired(from, context)](./ObjectConverter.convertRequired.md)

</td><td>



</td><td>

Converts the supplied object using the Conversion.ObjectConverter | ObjectConverter

</td></tr>
<tr><td>

[addPartial(addOptionalProperties)](./ObjectConverter.addPartial.md)

</td><td>



</td><td>

Creates a new Conversion.ObjectConverter | ObjectConverter derived from this one but with

</td></tr>
<tr><td>

[required()](./ObjectConverter.required.md)

</td><td>



</td><td>

Creates a new Conversion.ObjectConverter | ObjectConverter derived from this one but with

</td></tr>
<tr><td>

[convert(from, context, selfOverride)](./BaseConverter.convert.md)

</td><td>



</td><td>

Converts from `unknown` to `<T>`.

</td></tr>
<tr><td>

[convertOptional(from, context, onError)](./BaseConverter.convertOptional.md)

</td><td>



</td><td>

Converts from `unknown` to `<T>` or `undefined`, as appropriate.

</td></tr>
<tr><td>

[optional(onError)](./BaseConverter.optional.md)

</td><td>



</td><td>

Creates a Converter for an optional value.

</td></tr>
<tr><td>

[map(mapper)](./BaseConverter.map.md)

</td><td>



</td><td>

Creates a Converter which applies a (possibly) mapping conversion to

</td></tr>
<tr><td>

[mapConvert(mapConverter)](./BaseConverter.mapConvert.md)

</td><td>



</td><td>

Creates a Converter which applies an additional supplied

</td></tr>
<tr><td>

[mapItems(mapper)](./BaseConverter.mapItems.md)

</td><td>



</td><td>

Creates a Converter which maps the individual items of a collection

</td></tr>
<tr><td>

[mapConvertItems(mapConverter)](./BaseConverter.mapConvertItems.md)

</td><td>



</td><td>

Creates a Converter which maps the individual items of a collection

</td></tr>
<tr><td>

[withAction(action)](./BaseConverter.withAction.md)

</td><td>



</td><td>

Creates a Converter | Converter which applies a supplied action after
conversion.

</td></tr>
<tr><td>

[withTypeGuard(guard, message)](./BaseConverter.withTypeGuard.md)

</td><td>



</td><td>

Creates a Converter which applies a supplied type guard to the conversion

</td></tr>
<tr><td>

[withItemTypeGuard(guard, message)](./BaseConverter.withItemTypeGuard.md)

</td><td>



</td><td>

Creates a Converter which applies a supplied type guard to each member of

</td></tr>
<tr><td>

[withConstraint(constraint, options)](./BaseConverter.withConstraint.md)

</td><td>



</td><td>

Creates a Converter which applies an optional constraint to the result
of this conversion.

</td></tr>
<tr><td>

[withBrand(brand)](./BaseConverter.withBrand.md)

</td><td>



</td><td>

Returns a converter which adds a brand to the type to prevent mismatched usage

</td></tr>
<tr><td>

[withDefault(defaultValue)](./BaseConverter.withDefault.md)

</td><td>



</td><td>

Returns a Converter which always succeeds with a default value rather than failing.

</td></tr>
<tr><td>

[or(other)](./BaseConverter.or.md)

</td><td>



</td><td>

Chains this converter with another of the same type, to be attempted if this

</td></tr>
<tr><td>

[withFormattedError(formatter)](./BaseConverter.withFormattedError.md)

</td><td>



</td><td>

Creates a new Converter which is derived from this one but which returns an

</td></tr>
</tbody></table>
