[Home](../README.md) > [KeyStore](./KeyStore.md) > unlockWithKey

## KeyStore.unlockWithKey() method

Unlocks an existing key store with a pre-derived key, bypassing
PBKDF2 key derivation. Use this when the derived key has been
stored externally (e.g., in another key store) and the original
password is no longer available.

The supplied key must have been derived from the correct password
using the key store file's own PBKDF2 parameters (salt and
iteration count).

**Signature:**

```typescript
unlockWithKey(derivedKey: Uint8Array): Promise<Result<KeyStore>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>derivedKey</td><td>Uint8Array</td><td>The pre-derived master key (32 bytes for AES-256)</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[KeyStore](KeyStore.md)&gt;&gt;

Success with this instance when unlocked, Failure if key is incorrect
