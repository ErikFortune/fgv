[Home](../README.md) > Converter

# Interface: Converter

Generic converter to convert unknown to a templated type `<T>`, using
intrinsic rules or as modified by an optional conversion context
of optional templated type `<TC>` (default `undefined`).

**Extends:** [`ConverterTraits`](ConverterTraits.md)

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

[isOptional](./Converter.isOptional.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates whether this element is explicitly optional.

</td></tr>
<tr><td>

[brand](./Converter.brand.md)

</td><td>

`readonly`

</td><td>

string

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

[convert(from, context, selfOverride)](./Converter.convert.md)

</td><td>



</td><td>

Converts from `unknown` to `<T>`.

</td></tr>
<tr><td>

[convertOptional(from, context, onError)](./Converter.convertOptional.md)

</td><td>



</td><td>

Converts from `unknown` to `<T>` or `undefined`, as appropriate.

</td></tr>
<tr><td>

[optional(onError)](./Converter.optional.md)

</td><td>



</td><td>

Creates a Converter for an optional value.

</td></tr>
<tr><td>

[map(mapper)](./Converter.map.md)

</td><td>



</td><td>

Creates a Converter which applies a (possibly) mapping conversion to

</td></tr>
<tr><td>

[mapConvert(mapConverter)](./Converter.mapConvert.md)

</td><td>



</td><td>

Creates a Converter which applies an additional supplied

</td></tr>
<tr><td>

[mapItems(mapper)](./Converter.mapItems.md)

</td><td>



</td><td>

Creates a Converter which maps the individual items of a collection

</td></tr>
<tr><td>

[mapConvertItems(mapConverter)](./Converter.mapConvertItems.md)

</td><td>



</td><td>

Creates a Converter which maps the individual items of a collection

</td></tr>
<tr><td>

[withAction(action)](./Converter.withAction.md)

</td><td>



</td><td>

Creates a Converter | Converter which applies a supplied action after
conversion.

</td></tr>
<tr><td>

[withTypeGuard(guard, message)](./Converter.withTypeGuard.md)

</td><td>



</td><td>

Creates a Converter which applies a supplied type guard to the conversion

</td></tr>
<tr><td>

[withItemTypeGuard(guard, message)](./Converter.withItemTypeGuard.md)

</td><td>



</td><td>

Creates a Converter which applies a supplied type guard to each member of

</td></tr>
<tr><td>

[withConstraint(constraint, options)](./Converter.withConstraint.md)

</td><td>



</td><td>

Creates a Converter which applies an optional constraint to the result
of this conversion.

</td></tr>
<tr><td>

[withFormattedError(formatter)](./Converter.withFormattedError.md)

</td><td>



</td><td>

Creates a new Converter which is derived from this one but which returns an

</td></tr>
<tr><td>

[withBrand(brand)](./Converter.withBrand.md)

</td><td>



</td><td>

returns a converter which adds a brand to the type to prevent mismatched usage

</td></tr>
<tr><td>

[withDefault(dflt)](./Converter.withDefault.md)

</td><td>



</td><td>

Returns a Converter which always succeeds with a default value rather than failing.

</td></tr>
<tr><td>

[or(other)](./Converter.or.md)

</td><td>



</td><td>

Chains this converter with another of the same type, to be attempted if this

</td></tr>
</tbody></table>
