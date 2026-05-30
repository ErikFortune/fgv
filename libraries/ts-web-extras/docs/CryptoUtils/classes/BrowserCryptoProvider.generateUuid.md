[Home](../../README.md) > [CryptoUtils](../README.md) > [BrowserCryptoProvider](./BrowserCryptoProvider.md) > generateUuid

## BrowserCryptoProvider.generateUuid() method

Generates a cryptographically random UUIDv4 using the injected
`Crypto` instance.

**Signature:**

```typescript
generateUuid(): Result<Uuid>;
```

**Returns:**

Result&lt;Uuid&gt;

`Success` with the generated UUID, or `Failure` if the underlying
`Crypto` instance does not expose `randomUUID`.
