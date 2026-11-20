[Home](../../README.md) > [CryptoUtils](../README.md) > [EncryptedFilePrivateKeyStorage](./EncryptedFilePrivateKeyStorage.md) > create

## EncryptedFilePrivateKeyStorage.create() method

Creates a new CryptoUtils.KeyStore.EncryptedFilePrivateKeyStorage.

**Signature:**

```typescript
static create(params: IEncryptedFilePrivateKeyStorageCreateParams): Result<EncryptedFilePrivateKeyStorage>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IEncryptedFilePrivateKeyStorageCreateParams</td><td>CryptoUtils.KeyStore.IEncryptedFilePrivateKeyStorageCreateParams.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EncryptedFilePrivateKeyStorage](../../classes/EncryptedFilePrivateKeyStorage.md)&gt;

`Success` with the new instance, or `Failure` if the encryption
key is the wrong size or the storage directory cannot be opened.
