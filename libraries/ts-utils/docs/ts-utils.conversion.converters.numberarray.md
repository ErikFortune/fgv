<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Conversion](./ts-utils.conversion.md) &gt; [Converters](./ts-utils.conversion.converters.md) &gt; [numberArray](./ts-utils.conversion.converters.numberarray.md)

## Conversion.Converters.numberArray variable

[Converter](./ts-utils.converter.md) to convert an `unknown` to an array of `number`<!-- -->.

**Signature:**

```typescript
numberArray: Converter<number[] | undefined>
```

## Remarks

Returns [Success](./ts-utils.success.md) with the the supplied value if it as an array of numbers, returns [Failure](./ts-utils.failure.md) with an error message otherwise.
