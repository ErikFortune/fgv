[Home](../../README.md) > [Collections](../README.md) > [IAggregatedResultMapConstructorParams](./IAggregatedResultMapConstructorParams.md) > metadataConverter

## IAggregatedResultMapConstructorParams.metadataConverter property

Optional converter or validator for collection metadata.  If not provided, a metadata field
in the input will cause a validation failure.

**Signature:**

```typescript
readonly metadataConverter: Converter<TMETADATA, unknown> | Validator<TMETADATA, unknown>;
```
