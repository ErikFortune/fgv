[Home](../../README.md) > [CryptoUtils](../README.md) > [ICryptoProvider](./ICryptoProvider.md) > generateUuid

## ICryptoProvider.generateUuid() method

Generates a cryptographically random UUIDv4 using the provider's
underlying source of randomness. The default Node and browser
implementations delegate to `globalThis.crypto.randomUUID`;
deterministic providers (e.g. test stubs) may override to produce
reproducible values.

**Signature:**

```typescript
generateUuid(): Result<Uuid>;
```

**Returns:**

Result&lt;Uuid&gt;

Success with a canonical UUID, or Failure with error.
