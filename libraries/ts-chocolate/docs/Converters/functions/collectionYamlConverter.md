[Home](../../README.md) > [Converters](../README.md) > collectionYamlConverter

# Function: collectionYamlConverter

Creates a converter for YAML collection source files.
Parses YAML string content and validates as a collection source file.

## Signature

```typescript
function collectionYamlConverter(itemConverter: Converter<T, unknown> | Validator<T, unknown>): Converter<ICollectionSourceFile<T>>
```
