<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [RangeOf](./ts-utils.rangeof.md) &gt; [toFormattedProperties](./ts-utils.rangeof.toformattedproperties.md)

## RangeOf.toFormattedProperties() method

Formats the minimum and maximum values of this range.

**Signature:**

```typescript
toFormattedProperties(format: (value: T) => string | undefined): RangeOfProperties<string>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  format | (value: T) =&gt; string \| undefined | A format function used to format the values. |

**Returns:**

[RangeOfProperties](./ts-utils.rangeofproperties.md)<!-- -->&lt;string&gt;

A [RangeOfProperties&lt;string&gt;](./ts-utils.rangeofproperties.md) contaning the formatted representation of the [minimum](./ts-utils.rangeof.min.md) and [maximum](./ts-utils.rangeof.max.md) extent of the range, or `undefined` for an extent that is not present.
