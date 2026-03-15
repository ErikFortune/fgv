[Home](../../README.md) > [LibraryData](../README.md) > collectionJsonConverter

# Function: collectionJsonConverter

Creates a converter for JSON collection source files.
Parses JSON string content and validates as a collection source file.

## Signature

```typescript
function collectionJsonConverter(itemConverter: Converter<T, unknown> | Validator<T, unknown>): Converter<ICollectionSourceFile<T>>
```
