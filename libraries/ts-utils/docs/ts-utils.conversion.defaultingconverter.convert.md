<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Conversion](./ts-utils.conversion.md) &gt; [DefaultingConverter](./ts-utils.conversion.defaultingconverter.md) &gt; [convert](./ts-utils.conversion.defaultingconverter.convert.md)

## Conversion.DefaultingConverter.convert() method

Convert the supplied `unknown` to `Success<T>` or to the `Success` with the default value if conversion is not possible.

**Signature:**

```typescript
convert(from: unknown, ctx?: TC): Success<T | TD>;
```

## Parameters

<table><thead><tr><th>

Parameter


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

from


</td><td>

unknown


</td><td>

the value to be converted.


</td></tr>
<tr><td>

ctx


</td><td>

TC


</td><td>

_(Optional)_ optional context for the conversion.


</td></tr>
</tbody></table>
**Returns:**

[Success](./ts-utils.success.md)<!-- -->&lt;T \| TD&gt;

