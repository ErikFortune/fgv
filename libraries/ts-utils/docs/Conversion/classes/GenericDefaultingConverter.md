[Home](../../README.md) > [Conversion](../README.md) > GenericDefaultingConverter

# Class: GenericDefaultingConverter

Generic Conversion.DefaultingConverter | DefaultingConverter, which wraps another converter
to substitute a supplied default value for any errors returned by the inner converter.

**Implements:** [`DefaultingConverter<T, TD, TC>`](../../interfaces/DefaultingConverter.md)

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

`constructor(converter, defaultValue)`

</td><td>



</td><td>

Constructs a new Conversion.GenericDefaultingConverter | generic defaulting converter.

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

[defaultValue](./GenericDefaultingConverter.defaultValue.md)

</td><td>



</td><td>

TD

</td><td>

Default value to use if the conversion fails.

</td></tr>
<tr><td>

[isOptional](./GenericDefaultingConverter.isOptional.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates whether this element is explicitly optional.

</td></tr>
<tr><td>

[brand](./GenericDefaultingConverter.brand.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Indicates whether this element is explicitly optional.

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

[convert(from, ctx)](./GenericDefaultingConverter.convert.md)

</td><td>



</td><td>

Converts from `unknown` to `<T>`.

</td></tr>
<tr><td>

[convertOptional(from, context, onError)](./GenericDefaultingConverter.convertOptional.md)

</td><td>



</td><td>

Converts from `unknown` to `<T>` or `undefined`, as appropriate.

</td></tr>
<tr><td>

[optional(onError)](./GenericDefaultingConverter.optional.md)

</td><td>



</td><td>

Creates a Converter for an optional value.

</td></tr>
<tr><td>

[map(mapper)](./GenericDefaultingConverter.map.md)

</td><td>



</td><td>

Creates a Converter which applies a (possibly) mapping conversion to

</td></tr>
<tr><td>

[mapConvert(mapConverter)](./GenericDefaultingConverter.mapConvert.md)

</td><td>



</td><td>

Creates a Converter which applies an additional supplied

</td></tr>
<tr><td>

[mapItems(mapper)](./GenericDefaultingConverter.mapItems.md)

</td><td>



</td><td>

Creates a Converter which maps the individual items of a collection

</td></tr>
<tr><td>

[mapConvertItems(mapConverter)](./GenericDefaultingConverter.mapConvertItems.md)

</td><td>



</td><td>

Creates a Converter which maps the individual items of a collection

</td></tr>
<tr><td>

[withAction(action)](./GenericDefaultingConverter.withAction.md)

</td><td>



</td><td>

Creates a Converter | Converter which applies a supplied action after
conversion.

</td></tr>
<tr><td>

[withTypeGuard(guard, message)](./GenericDefaultingConverter.withTypeGuard.md)

</td><td>



</td><td>

Creates a Converter which applies a supplied type guard to the conversion

</td></tr>
<tr><td>

[withItemTypeGuard(guard, message)](./GenericDefaultingConverter.withItemTypeGuard.md)

</td><td>



</td><td>

Creates a Converter which applies a supplied type guard to each member of

</td></tr>
<tr><td>

[withConstraint(constraint, options)](./GenericDefaultingConverter.withConstraint.md)

</td><td>



</td><td>

Creates a Converter which applies an optional constraint to the result
of this conversion.

</td></tr>
<tr><td>

[withBrand(brand)](./GenericDefaultingConverter.withBrand.md)

</td><td>



</td><td>

returns a converter which adds a brand to the type to prevent mismatched usage

</td></tr>
<tr><td>

[withFormattedError(formatter)](./GenericDefaultingConverter.withFormattedError.md)

</td><td>



</td><td>

Creates a new Converter which is derived from this one but which returns an

</td></tr>
<tr><td>

[withDefault(dflt)](./GenericDefaultingConverter.withDefault.md)

</td><td>



</td><td>

Returns a Converter which always succeeds with the supplied default value rather
than failing.

</td></tr>
<tr><td>

[or(__converter)](./GenericDefaultingConverter.or.md)

</td><td>



</td><td>

Chains this converter with another of the same type, to be attempted if this

</td></tr>
</tbody></table>
