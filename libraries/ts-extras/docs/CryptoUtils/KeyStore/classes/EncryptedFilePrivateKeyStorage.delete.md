[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > [EncryptedFilePrivateKeyStorage](./EncryptedFilePrivateKeyStorage.md) > delete

## EncryptedFilePrivateKeyStorage.delete() method

Deletes the entry stored under `id`. Missing ids fail (the read path is
keystore-driven and never asks to delete an id it did not store).

**Signature:**

```typescript
delete(id: string): Promise<Result<string>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>string</td><td>Storage handle.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;string&gt;&gt;
