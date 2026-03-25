[Home](../../README.md) > [KeyStore](../README.md) > [KeyStore](./KeyStore.md) > removeSecret

## KeyStore.removeSecret() method

Removes a secret by name.

**Signature:**

```typescript
removeSecret(name: string): Result<IKeyStoreSecretEntry>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Name of the secret to remove</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IKeyStoreSecretEntry](../../interfaces/IKeyStoreSecretEntry.md)&gt;

Success with removed entry, Failure if not found or locked
