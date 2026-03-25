[Home](../../README.md) > [Conversion](../README.md) > StringConverter

# Class: StringConverter

The Conversion.StringConverter | StringConverter class extends
Conversion.BaseConverter | BaseConverter to provide string-specific
helper methods.

**Extends:** [`BaseConverter<T, TC>`](../../classes/BaseConverter.md)

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

`constructor(defaultContext, traits, converter)`

</td><td>



</td><td>

Construct a new Conversion.StringConverter | StringConverter.

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

[convert(from, context)](./BaseConverter.convert.md)

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

returns a converter which adds a brand to the type to prevent mismatched usage

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
