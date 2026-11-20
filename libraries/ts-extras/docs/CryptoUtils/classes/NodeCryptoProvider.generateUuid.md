[Home](../../README.md) > [CryptoUtils](../README.md) > [NodeCryptoProvider](./NodeCryptoProvider.md) > generateUuid

## NodeCryptoProvider.generateUuid() method

Generates a cryptographically random UUIDv4 via the platform Web Crypto API.

**Signature:**

```typescript
generateUuid(): Result<Uuid>;
```

**Returns:**

Result&lt;Uuid&gt;

`Success` with the generated UUID, or `Failure` if the runtime
does not expose `globalThis.crypto.randomUUID`.
