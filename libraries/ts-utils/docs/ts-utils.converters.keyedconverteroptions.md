<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Converters](./ts-utils.converters.md) &gt; [KeyedConverterOptions](./ts-utils.converters.keyedconverteroptions.md)

## Converters.KeyedConverterOptions interface

Options for [Converters.recordOf](./ts-utils.converters.recordof_2.md) and [Converters.mapOf](./ts-utils.converters.mapof_2.md) helper functions.

**Signature:**

```typescript
export interface KeyedConverterOptions<T extends string = string, TC = undefined> 
```

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [keyConverter?](./ts-utils.converters.keyedconverteroptions.keyconverter.md) |  | [Converter](./ts-utils.converter.md)<!-- -->&lt;T, TC&gt; | _(Optional)_ If present, <code>keyConverter</code> is used to convert the source object property names to keys in the resulting map or record. |
|  [onError?](./ts-utils.converters.keyedconverteroptions.onerror.md) |  | 'fail' \| 'ignore' | _(Optional)_ if <code>onError</code> is <code>'fail'</code> (default), then the entire conversion fails if any key or element cannot be converted. If <code>onError</code> is <code>'ignore'</code>, failing elements are silently ignored. |
