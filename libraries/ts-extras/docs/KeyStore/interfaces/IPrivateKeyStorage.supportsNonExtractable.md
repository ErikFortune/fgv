[Home](../../README.md) > [KeyStore](../README.md) > [IPrivateKeyStorage](./IPrivateKeyStorage.md) > supportsNonExtractable

## IPrivateKeyStorage.supportsNonExtractable property

Whether keys generated for this backend may be marked
`extractable: false`. `true` on backends that store `CryptoKey`
objects directly (e.g. IndexedDB). `false` on backends that must
round-trip via JWK (e.g. encrypted-file backends).

**Signature:**

```typescript
readonly supportsNonExtractable: boolean;
```
