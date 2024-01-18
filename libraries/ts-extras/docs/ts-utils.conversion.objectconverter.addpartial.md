<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Conversion](./ts-utils.conversion.md) &gt; [ObjectConverter](./ts-utils.conversion.objectconverter.md) &gt; [addPartial](./ts-utils.conversion.objectconverter.addpartial.md)

## Conversion.ObjectConverter.addPartial() method

Creates a new [ObjectConverter](./ts-utils.conversion.objectconverter.md) derived from this one but with new optional properties as specified by a supplied array of `keyof T`<!-- -->.

**Signature:**

```typescript
addPartial(addOptionalProperties: (keyof T)[]): ObjectConverter<Partial<T>, TC>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  addOptionalProperties | (keyof T)\[\] | The keys to be made optional. |

**Returns:**

[ObjectConverter](./ts-utils.conversion.objectconverter.md)<!-- -->&lt;Partial&lt;T&gt;, TC&gt;

A new [ObjectConverter](./ts-utils.conversion.objectconverter.md) with the additional optional source properties.
