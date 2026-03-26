[Home](../../README.md) > [CryptoUtils](../README.md) > [KeyStore](./KeyStore.md) > getSecret

## KeyStore.getSecret() method

Gets a secret by name.

**Signature:**

```typescript
getSecret(name: string): Result<IKeyStoreSecretEntry>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Name of the secret</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IKeyStoreSecretEntry](../../interfaces/IKeyStoreSecretEntry.md)&gt;

Success with secret entry, Failure if not found or locked
