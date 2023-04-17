<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json](./ts-json.md) &gt; [IJsonConverterOptions](./ts-json.ijsonconverteroptions.md) &gt; [onUndefinedPropertyValue](./ts-json.ijsonconverteroptions.onundefinedpropertyvalue.md)

## IJsonConverterOptions.onUndefinedPropertyValue property

If onUnknownPropertyValue is error, then any property with value undefined will cause an error and stop conversion. If onUndefinedPropertyValue is 'ignore' (default) then any property with value undefined is silently ignored.

**Signature:**

```typescript
onUndefinedPropertyValue: 'error' | 'ignore';
```