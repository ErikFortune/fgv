[Home](../../README.md) > [CryptoUtils](../README.md) > [EncryptedFilePrivateKeyStorage](./EncryptedFilePrivateKeyStorage.md) > load

## EncryptedFilePrivateKeyStorage.load() method

Loads the private key stored under `id`, decrypting and re-importing it from
JWK.

**Signature:**

```typescript
load(id: string): Promise<Result<CryptoKey>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>string</td><td>Storage handle.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;CryptoKey&gt;&gt;
