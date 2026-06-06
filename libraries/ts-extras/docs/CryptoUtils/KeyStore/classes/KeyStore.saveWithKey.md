[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > [KeyStore](./KeyStore.md) > saveWithKey

## KeyStore.saveWithKey() method

Saves the key store using a pre-derived key, bypassing PBKDF2 key
derivation. Use this when the derived key has been stored externally
(e.g., in another key store) and the original password is no longer
available.

The supplied key must be the same key that was (or would be) derived
from the master password using the key store's PBKDF2 parameters.

**Signature:**

```typescript
saveWithKey(derivedKey: Uint8Array): Promise<Result<IKeyStoreFile>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>derivedKey</td><td>Uint8Array</td><td>The pre-derived master key (32 bytes for AES-256)</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IKeyStoreFile](../../../interfaces/IKeyStoreFile.md)&gt;&gt;

Success with IKeyStoreFile, Failure if locked or key invalid
