[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > [KeyStore](./KeyStore.md) > save

## KeyStore.save() method

Saves the key store, returning the encrypted file content.
Requires the master password to encrypt.

**Signature:**

```typescript
save(password: string): Promise<Result<IKeyStoreFile>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>password</td><td>string</td><td>The master password</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IKeyStoreFile](../../../interfaces/IKeyStoreFile.md)&gt;&gt;

Success with IKeyStoreFile, Failure if locked
