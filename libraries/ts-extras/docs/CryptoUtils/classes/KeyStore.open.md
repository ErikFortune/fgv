[Home](../../README.md) > [CryptoUtils](../README.md) > [KeyStore](./KeyStore.md) > open

## KeyStore.open() method

Opens an existing encrypted key store.
Call `unlock(password)` to decrypt and access secrets.

**Signature:**

```typescript
static open(params: IKeyStoreOpenParams): Result<KeyStore>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IKeyStoreOpenParams</td><td>Open parameters including the encrypted file</td></tr>
</tbody></table>

**Returns:**

Result&lt;[KeyStore](../../classes/KeyStore.md)&gt;

Success with KeyStore instance, or Failure if file format invalid
