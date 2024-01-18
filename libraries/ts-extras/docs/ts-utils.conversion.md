<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Conversion](./ts-utils.conversion.md)

## Conversion namespace

## Classes

|  Class | Description |
|  --- | --- |
|  [BaseConverter](./ts-utils.conversion.baseconverter.md) | Base templated wrapper to simplify creation of new [Converter](./ts-utils.converter.md)<!-- -->s. |
|  [ObjectConverter](./ts-utils.conversion.objectconverter.md) | A [Converter](./ts-utils.converter.md) which converts an object of type <code>&lt;T&gt;</code> without changing shape, given a [FieldConverters&lt;T&gt;](./ts-utils.conversion.fieldconverters.md) for the fields in the object. |
|  [StringConverter](./ts-utils.conversion.stringconverter.md) | The [StringConverter](./ts-utils.conversion.stringconverter.md) class extends [BaseConverter](./ts-utils.conversion.baseconverter.md) to provide string-specific helper methods. |

## Interfaces

|  Interface | Description |
|  --- | --- |
|  [ConstraintOptions](./ts-utils.conversion.constraintoptions.md) | Options for [Converter.withConstraint()](./ts-utils.converter.withconstraint.md)<!-- -->. |
|  [Converter](./ts-utils.conversion.converter.md) | Generic converter to convert unknown to a templated type <code>&lt;T&gt;</code>, using intrinsic rules or as modified by an optional conversion context of optional templated type <code>&lt;TC&gt;</code> (default <code>undefined</code>). |
|  [ConverterTraits](./ts-utils.conversion.convertertraits.md) | Converter traits. |
|  [ObjectConverterOptions](./ts-utils.conversion.objectconverteroptions.md) | Options for an [ObjectConverter](./ts-utils.conversion.objectconverter.md)<!-- -->. |
|  [StringMatchOptions](./ts-utils.conversion.stringmatchoptions.md) | Options for [StringConverter](./ts-utils.conversion.stringconverter.md) matching method |

## Namespaces

|  Namespace | Description |
|  --- | --- |
|  [Converters](./ts-utils.conversion.converters.md) |  |

## Type Aliases

|  Type Alias | Description |
|  --- | --- |
|  [FieldConverters](./ts-utils.conversion.fieldconverters.md) | Per-property converters for each of the properties in type T. |
|  [Infer](./ts-utils.conversion.infer.md) | **_(BETA)_** Infers the type that will be returned by an instantiated converter. Works for complex as well as simple types. |
