<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Conversion](./ts-utils.conversion.md) &gt; [GenericDefaultingConverter](./ts-utils.conversion.genericdefaultingconverter.md) &gt; [(constructor)](./ts-utils.conversion.genericdefaultingconverter._constructor_.md)

## Conversion.GenericDefaultingConverter.(constructor)

Constructs a new [generic defaulting converter](./ts-utils.conversion.genericdefaultingconverter.md)<!-- -->.

**Signature:**

```typescript
constructor(converter: Converter<T, TC>, defaultValue: TD);
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  converter | [Converter](./ts-utils.converter.md)<!-- -->&lt;T, TC&gt; | inner [Converter](./ts-utils.converter.md) used for the base conversion. |
|  defaultValue | TD | default value to be supplied if the inner conversion fails. |

