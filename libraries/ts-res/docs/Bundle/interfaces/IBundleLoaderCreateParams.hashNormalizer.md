[Home](../../README.md) > [Bundle](../README.md) > [IBundleLoaderCreateParams](./IBundleLoaderCreateParams.md) > hashNormalizer

## IBundleLoaderCreateParams.hashNormalizer property

Optional hash normalizer for verifying checksums. If not provided,
a CRC32 normalizer will be used for browser compatibility.
Must match the normalizer used during bundle creation.

**Signature:**

```typescript
hashNormalizer: HashingNormalizer;
```
