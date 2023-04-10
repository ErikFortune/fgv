<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Conversion](./ts-utils.conversion.md) &gt; [Converters](./ts-utils.conversion.converters.md) &gt; [validated](./ts-utils.conversion.converters.validated.md)

## Conversion.Converters.validated() function

Helper function to create a [Converter](./ts-utils.converter.md) from any [Validation.Validator](./ts-utils.validation.validator.md)

**Signature:**

```typescript
export declare function validated<T, TC = unknown>(validator: Validator<T, TC>): Converter<T, TC>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  validator | [Validator](./ts-utils.validator.md)<!-- -->&lt;T, TC&gt; | the validator to be wrapped |

**Returns:**

[Converter](./ts-utils.converter.md)<!-- -->&lt;T, TC&gt;

A [Converter](./ts-utils.converter.md) which uses the supplied validator.
