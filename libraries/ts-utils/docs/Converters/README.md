[Home](../README.md) > Converters

# Namespace: Converters

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[KeyedConverterOptions](./interfaces/KeyedConverterOptions.md)

</td><td>

Options for recordOf and

</td></tr>
<tr><td>

[ICompositeId](./interfaces/ICompositeId.md)

</td><td>

Represents a composite ID constructed of two strongly-typed string IDs

</td></tr>
<tr><td>

[IPartialCompositeId](./interfaces/IPartialCompositeId.md)

</td><td>

Represents a partial composite ID, where separator is optional.

</td></tr>
<tr><td>

[TransformObjectOptions](./interfaces/TransformObjectOptions.md)

</td><td>

Options for a Converters.transformObject call.

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

[StrictObjectConverterOptions](./type-aliases/StrictObjectConverterOptions.md)

</td><td>

Options for the strictObject helper function.

</td></tr>
<tr><td>

[DiscriminatedObjectConverters](./type-aliases/DiscriminatedObjectConverters.md)

</td><td>

A string-keyed `Record<string, Converter>` which maps specific Converter | converters or

</td></tr>
<tr><td>

[FieldTransformers](./type-aliases/FieldTransformers.md)

</td><td>

Per-property converters and configuration for each field in the destination object of

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[enumeratedValue](./functions/enumeratedValue.md)

</td><td>

Helper function to create a Converter | Converter which converts `unknown` to one of a set of supplied
enumerated values.

</td></tr>
<tr><td>

[mappedEnumeratedValue](./functions/mappedEnumeratedValue.md)

</td><td>

Helper function to create a Converter | Converter which converts `unknown` to one of a set of supplied enumerated

</td></tr>
<tr><td>

[literal](./functions/literal.md)

</td><td>

Helper function to create a Converter | Converter which converts `unknown` to some supplied literal value.

</td></tr>
<tr><td>

[delimitedString](./functions/delimitedString.md)

</td><td>

Helper function to create a Converter | Converter which converts any `string` into an

</td></tr>
<tr><td>

[isValidator](./functions/isValidator.md)

</td><td>

Determines if a supplied Conversion.Converter | Converter or Validation.Validator | Validator is

</td></tr>
<tr><td>

[validated](./functions/validated.md)

</td><td>

Helper function to create a Converter | Converter from any Validation.Validator

</td></tr>
<tr><td>

[asValidator](./functions/asValidator.md)

</td><td>

Helper function to create a Validation.Validator | Validator from any Conversion.Converter | Converter

</td></tr>
<tr><td>

[generic](./functions/generic.md)

</td><td>

Helper function to create a Converter | Converter from a supplied Conversion.ConverterFunc | ConverterFunc.

</td></tr>
<tr><td>

[isA](./functions/isA.md)

</td><td>

Helper function to create a Converter | Converter from a supplied type guard function.

</td></tr>
<tr><td>

[oneOf](./functions/oneOf.md)

</td><td>

A helper function to create a Converter | Converter for polymorphic values.

</td></tr>
<tr><td>

[arrayOf](./functions/arrayOf.md)

</td><td>

A helper function to create a Converter | Converter which converts `unknown` to an array of `<T>`.

</td></tr>
<tr><td>

[validateWith](./functions/validateWith.md)

</td><td>

Helper function to create  a Converter | Converter which validates that a supplied value is

</td></tr>
<tr><td>

[element](./functions/element.md)

</td><td>

A helper function to create a Converter | Converter which extracts and converts an element from an array.

</td></tr>
<tr><td>

[optionalElement](./functions/optionalElement.md)

</td><td>

A helper function to create a Converter | Converter which extracts and converts an optional element from an array.

</td></tr>
<tr><td>

[field](./functions/field.md)

</td><td>

A helper function to create a Converter | Converter which extracts and convert a property specified

</td></tr>
<tr><td>

[optionalField](./functions/optionalField.md)

</td><td>

A helper function to create a Converter | Converter which extracts and convert a property specified

</td></tr>
<tr><td>

[discriminatedObject](./functions/discriminatedObject.md)

</td><td>

Helper to create a Converter | Converter which converts a discriminated object without changing shape.

</td></tr>
<tr><td>

[compositeIdFromObject](./functions/compositeIdFromObject.md)

</td><td>

Creates an ObjectConverter | ObjectConverter for a strongly-typed Converters.ICompositeId | CompositeId.

</td></tr>
<tr><td>

[compositeIdFromString](./functions/compositeIdFromString.md)

</td><td>

Converts a composite ID string into a strongly-typed Converters.ICompositeId | CompositeId.

</td></tr>
<tr><td>

[compositeId](./functions/compositeId.md)

</td><td>

Creates a Converter | Converter for a strongly-typed Converters.ICompositeId | CompositeId from

</td></tr>
<tr><td>

[compositeIdString](./functions/compositeIdString.md)

</td><td>

Converts a strongly-typed Converters.ICompositeId | CompositeId into a string.

</td></tr>
<tr><td>

[transform](./functions/transform.md)

</td><td>

Helper to create a Converter | Converter which converts a source object to a new object with a

</td></tr>
<tr><td>

[transformObject](./functions/transformObject.md)

</td><td>

Helper to create a strongly-typed Converter | Converter which converts a source object to a

</td></tr>
<tr><td>

[tuple](./functions/tuple.md)

</td><td>

Creates a Converter | Converter that converts an array to a strongly-typed tuple,

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[string](./variables/string.md)

</td><td>

A converter to convert unknown to string.

</td></tr>
<tr><td>

[number](./variables/number.md)

</td><td>

A Converter | Converter which converts `unknown` to a `number`.

</td></tr>
<tr><td>

[boolean](./variables/boolean.md)

</td><td>

A Converter | Converter which converts `unknown` to `boolean`.

</td></tr>
<tr><td>

[optionalString](./variables/optionalString.md)

</td><td>

A Converter | Converter which converts an optional `string` value.

</td></tr>
<tr><td>

[optionalNumber](./variables/optionalNumber.md)

</td><td>

A Converter | Converter which converts an optional `number` value.

</td></tr>
<tr><td>

[optionalBoolean](./variables/optionalBoolean.md)

</td><td>

A Converter | Converter to convert an optional `boolean` value.

</td></tr>
<tr><td>

[stringArray](./variables/stringArray.md)

</td><td>

Converter | Converter to convert an `unknown` to an array of `string`.

</td></tr>
<tr><td>

[numberArray](./variables/numberArray.md)

</td><td>

Converter | Converter to convert an `unknown` to an array of `number`.

</td></tr>
</tbody></table>
