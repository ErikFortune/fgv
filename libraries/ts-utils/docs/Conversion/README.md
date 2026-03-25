[Home](../README.md) > Conversion

# Namespace: Conversion

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[BaseConverter](./classes/BaseConverter.md)

</td><td>

Base templated wrapper to simplify creation of new Converters.

</td></tr>
<tr><td>

[GenericDefaultingConverter](./classes/GenericDefaultingConverter.md)

</td><td>

Generic Conversion.DefaultingConverter | DefaultingConverter, which wraps another converter

</td></tr>
<tr><td>

[ObjectConverter](./classes/ObjectConverter.md)

</td><td>

A Converter | Converter which converts an object of type `<T>` without changing shape, given

</td></tr>
<tr><td>

[StringConverter](./classes/StringConverter.md)

</td><td>

The Conversion.StringConverter | StringConverter class extends

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ConverterTraits](./interfaces/ConverterTraits.md)

</td><td>

Converter traits.

</td></tr>
<tr><td>

[ConstraintOptions](./interfaces/ConstraintOptions.md)

</td><td>

Options for Converter.withConstraint.

</td></tr>
<tr><td>

[Converter](./interfaces/Converter.md)

</td><td>

Generic converter to convert unknown to a templated type `<T>`, using

</td></tr>
<tr><td>

[DefaultingConverter](./interfaces/DefaultingConverter.md)

</td><td>



</td></tr>
<tr><td>

[ObjectConverterOptions](./interfaces/ObjectConverterOptions.md)

</td><td>

Options for an Conversion.ObjectConverter | ObjectConverter.

</td></tr>
<tr><td>

[StringMatchOptions](./interfaces/StringMatchOptions.md)

</td><td>

Options for Conversion.StringConverter | StringConverter

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Infer](./type-aliases/Infer.md)

</td><td>

Infers the type that will be returned by an instantiated converter.

</td></tr>
<tr><td>

[ConvertedToType](./type-aliases/ConvertedToType.md)

</td><td>

Deprecated name for Conversion.Infer | Infer retained for compatibility.

</td></tr>
<tr><td>

[ConverterResultType](./type-aliases/ConverterResultType.md)

</td><td>

Helper type to extract the result type from a Converter | Converter.

</td></tr>
<tr><td>

[ConverterResultTypes](./type-aliases/ConverterResultTypes.md)

</td><td>

Helper type to map a tuple of Converter | Converters to a tuple of their result types.

</td></tr>
<tr><td>

[ConverterFunc](./type-aliases/ConverterFunc.md)

</td><td>

Function signature for a converter function.

</td></tr>
<tr><td>

[OnError](./type-aliases/OnError.md)

</td><td>

Action to take on conversion failures.

</td></tr>
<tr><td>

[ConversionErrorFormatter](./type-aliases/ConversionErrorFormatter.md)

</td><td>

Formats an incoming error message and value that failed validation.

</td></tr>
<tr><td>

[FieldConverters](./type-aliases/FieldConverters.md)

</td><td>

Per-property converters or validators for each of the properties in type T.

</td></tr>
</tbody></table>
