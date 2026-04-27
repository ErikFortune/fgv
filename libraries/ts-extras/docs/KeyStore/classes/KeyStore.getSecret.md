[Home](../../README.md) > [KeyStore](../README.md) > [KeyStore](./KeyStore.md) > getSecret

## KeyStore.getSecret() method

Gets a secret by name. Returns the CryptoUtils.KeyStore.IKeyStoreEntry | discriminated union
— callers must check `entry.type` before accessing `key`/`id` since asymmetric
entries carry no raw key material.

**Signature:**

```typescript
getSecret(name: string): Result<IKeyStoreEntry>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Name of the secret</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IKeyStoreEntry](../../type-aliases/IKeyStoreEntry.md)&gt;

Success with secret entry, Failure if not found or locked
