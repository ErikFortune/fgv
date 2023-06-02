<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json](./ts-json.md) &gt; [Files](./ts-json.files.md) &gt; [ItemNameTransformFunction](./ts-json.files.itemnametransformfunction.md)

## Files.ItemNameTransformFunction type

Function to transform the name of a some entity, given an original name and the contents of the entity.

**Signature:**

```typescript
export type ItemNameTransformFunction<T> = (name: string, item: T) => Result<string>;
```