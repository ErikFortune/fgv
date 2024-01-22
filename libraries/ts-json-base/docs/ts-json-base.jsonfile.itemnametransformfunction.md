<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json-base](./ts-json-base.md) &gt; [JsonFile](./ts-json-base.jsonfile.md) &gt; [ItemNameTransformFunction](./ts-json-base.jsonfile.itemnametransformfunction.md)

## JsonFile.ItemNameTransformFunction type

Function to transform the name of a some entity, given an original name and the contents of the entity.

**Signature:**

```typescript
export type ItemNameTransformFunction<T> = (name: string, item: T) => Result<string>;
```