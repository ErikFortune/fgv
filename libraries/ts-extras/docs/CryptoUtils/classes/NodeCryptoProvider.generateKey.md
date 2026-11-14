[Home](../../README.md) > [CryptoUtils](../README.md) > [NodeCryptoProvider](./NodeCryptoProvider.md) > generateKey

## NodeCryptoProvider.generateKey() method

Generates a random 32-byte key suitable for AES-256.

**Signature:**

```typescript
generateKey(): Promise<Result<Uint8Array<ArrayBufferLike>>>;
```

**Returns:**

Promise&lt;Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;&gt;

`Success` with generated key, or `Failure` with an error.
