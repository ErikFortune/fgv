<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Converters](./ts-utils.converters.md) &gt; [optionalNumber](./ts-utils.converters.optionalnumber.md)

## Converters.optionalNumber variable

A [Converter](./ts-utils.converter.md) which converts an optional `number` value.

**Signature:**

```typescript
optionalNumber: Converter<number | undefined, unknown>
```

## Remarks

Values of type `number` or numeric strings are converted and returned. Anything else returns [Success](./ts-utils.success.md) with value `undefined`<!-- -->.

