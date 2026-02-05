[Home](../../README.md) > [LibraryData](../README.md) > [ICollectionLoaderInitParams](./ICollectionLoaderInitParams.md) > fileNameConverter

## ICollectionLoaderInitParams.fileNameConverter property

Optional converter to transform file names before applying the collection ID converter.
Defaults to LibraryData.Converters.removeJsonExtension | removeJsonExtension.

**Signature:**

```typescript
readonly fileNameConverter: Converter<string, unknown>;
```
