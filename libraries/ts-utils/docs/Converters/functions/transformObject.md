[Home](../../README.md) > [Converters](../README.md) > transformObject

# Function: transformObject

Helper to create a strongly-typed Converter | Converter which converts a source object to a
new object with a different shape.

## Signature

```typescript
function transformObject(destinationFields: FieldTransformers<TSRC, TDEST, TC>, options: TransformObjectOptions<TSRC>): Converter<TDEST, TC>
```
