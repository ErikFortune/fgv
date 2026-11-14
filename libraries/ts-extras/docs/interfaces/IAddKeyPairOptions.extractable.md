[Home](../README.md) > [IAddKeyPairOptions](./IAddKeyPairOptions.md) > extractable

## IAddKeyPairOptions.extractable property

Overrides the storage-backend-derived extractability for this key only.
Omit to keep the default (`!privateKeyStorage.supportsNonExtractable`).
A value the backend cannot honor fails loudly rather than silently
downgrading.

**Signature:**

```typescript
readonly extractable: boolean;
```
