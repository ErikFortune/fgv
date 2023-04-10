<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Conversion](./ts-utils.conversion.md) &gt; [ObjectConverterOptions](./ts-utils.conversion.objectconverteroptions.md)

## Conversion.ObjectConverterOptions interface

Options for an [ObjectConverter](./ts-utils.conversion.objectconverter.md)<!-- -->.

**Signature:**

```typescript
export interface ObjectConverterOptions<T> 
```

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [description?](./ts-utils.conversion.objectconverteroptions.description.md) |  | string | _(Optional)_ Optional description to be included in error messages. |
|  [optionalFields?](./ts-utils.conversion.objectconverteroptions.optionalfields.md) |  | (keyof T)\[\] | _(Optional)_ If present, lists optional fields. Missing non-optional fields cause an error. |
|  [strict?](./ts-utils.conversion.objectconverteroptions.strict.md) |  | boolean | _(Optional)_ If true, unrecognized fields yield an error. If false or undefined (default), unrecognized fields are ignored. |
