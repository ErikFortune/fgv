<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Conversion](./ts-utils.conversion.md) &gt; [Converters](./ts-utils.conversion.converters.md) &gt; [delimitedString](./ts-utils.conversion.converters.delimitedstring.md)

## Conversion.Converters.delimitedString() function

Helper function to create a [Converter](./ts-utils.converter.md) which converts any `string` into an array of `string`<!-- -->, by separating at a supplied delimiter.

**Signature:**

```typescript
export declare function delimitedString(delimiter: string, options?: 'filtered' | 'all'): Converter<string[], string>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  delimiter | string | The delimiter at which to split. |
|  options | 'filtered' \| 'all' | _(Optional)_ |

**Returns:**

[Converter](./ts-utils.converter.md)<!-- -->&lt;string\[\], string&gt;

A new [Converter](./ts-utils.converter.md) returning `string[]`<!-- -->.

## Remarks

Delimiter may also be supplied as context at conversion time.

