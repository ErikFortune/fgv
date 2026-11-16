[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > [KeyStore](./KeyStore.md) > setSecretMetadata

## KeyStore.setSecretMetadata() method

Replaces the mutable metadata on a symmetric entry and stamps `updatedAt`
with the current timestamp. Does NOT touch the secret `key` bytes — the
material reads back identically afterward.

Metadata is non-secret by contract but physically lives inside the vault
ciphertext (see CryptoUtils.KeyStore.IKeyStoreSymmetricEntry.metadata).

**Signature:**

```typescript
setSecretMetadata(name: string, value: JsonValue): Result<IKeyStoreSymmetricEntry>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Name of the secret to update</td></tr>
<tr><td>value</td><td>JsonValue</td><td>New metadata value (replaces any prior metadata)</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IKeyStoreSymmetricEntry](../../../interfaces/IKeyStoreSymmetricEntry.md)&gt;

Success with the updated entry, Failure if not found, locked, or
the entry is asymmetric
