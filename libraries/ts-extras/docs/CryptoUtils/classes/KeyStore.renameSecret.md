[Home](../../README.md) > [CryptoUtils](../README.md) > [KeyStore](./KeyStore.md) > renameSecret

## KeyStore.renameSecret() method

Renames a secret.

**Signature:**

```typescript
renameSecret(oldName: string, newName: string): Result<IKeyStoreSecretEntry>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>oldName</td><td>string</td><td>Current name</td></tr>
<tr><td>newName</td><td>string</td><td>New name</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IKeyStoreSecretEntry](../../interfaces/IKeyStoreSecretEntry.md)&gt;

Success with updated entry, Failure if source not found, target exists, or locked
