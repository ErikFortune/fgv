[Home](../README.md) > [EncryptedFilePrivateKeyStorage](./EncryptedFilePrivateKeyStorage.md) > store

## EncryptedFilePrivateKeyStorage.store() method

Stores `key` under `id` as an encrypted JWK file.

**Signature:**

```typescript
store(id: string, key: CryptoKey): Promise<Result<string>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>string</td><td>Storage handle. Must be a safe filename token
(`[A-Za-z0-9._-]+`, not `.`/`..`).</td></tr>
<tr><td>key</td><td>CryptoKey</td><td>The extractable private `CryptoKey` to persist.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;string&gt;&gt;
