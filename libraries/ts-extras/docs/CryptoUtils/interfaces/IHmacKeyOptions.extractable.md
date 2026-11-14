[Home](../../README.md) > [CryptoUtils](../README.md) > [IHmacKeyOptions](./IHmacKeyOptions.md) > extractable

## IHmacKeyOptions.extractable property

Whether the resulting `CryptoKey` may be exported. Defaults to `false`:
a non-extractable key can sign and verify but its bytes can never be read
back out of the crypto implementation.

**Signature:**

```typescript
readonly extractable: boolean;
```
