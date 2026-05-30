[Home](../../README.md) > [KeyStore](../README.md) > [KeyStore](./KeyStore.md) > listSecrets

## KeyStore.listSecrets() method

Lists all secret names in the key store.

**Signature:**

```typescript
listSecrets(): Result<readonly string[]>;
```

**Returns:**

Result&lt;readonly string[]&gt;

Success with array of secret names, Failure if locked
