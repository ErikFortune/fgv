<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Converters](./ts-utils.converters.md) &gt; [strictObject](./ts-utils.converters.strictobject_1.md)

## Converters.strictObject() function

> Warning: This API is now obsolete.
> 
> Use [Converters.strictObject(options)](./ts-utils.converters.strictobject.md) instead.
> 

Helper function to create a [ObjectConverter](./ts-utils.conversion.objectconverter.md) which converts an object without changing shape, a [FieldConverters&lt;T&gt;](./ts-utils.conversion.fieldconverters.md) and an optional [StrictObjectConverterOptions&lt;T&gt;](./ts-utils.converters.strictobjectconverteroptions.md) to further refine conversion behavior.

**Signature:**

```typescript
export declare function strictObject<T>(properties: FieldConverters<T>, optional: (keyof T)[]): ObjectConverter<T>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  properties | [FieldConverters](./ts-utils.conversion.fieldconverters.md)<!-- -->&lt;T&gt; | An object containing defining the shape and converters to be applied. |
|  optional | (keyof T)\[\] | An array of <code>keyof T</code> containing keys to be considered optional. |

**Returns:**

[ObjectConverter](./ts-utils.conversion.objectconverter.md)<!-- -->&lt;T&gt;

A new [ObjectConverter](./ts-utils.conversion.objectconverter.md) which applies the specified conversions. 

## Remarks

Fields that succeed but convert to undefined are omitted from the result object but do not fail the conversion.

The conversion fails if any unexpected fields are encountered.
