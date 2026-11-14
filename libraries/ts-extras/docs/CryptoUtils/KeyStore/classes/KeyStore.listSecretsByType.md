[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > [KeyStore](./KeyStore.md) > listSecretsByType

## KeyStore.listSecretsByType() method

Lists secret names filtered by type.

**Signature:**

```typescript
listSecretsByType(type: KeyStoreSecretType): Result<readonly string[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>type</td><td>KeyStoreSecretType</td><td>The secret type to filter by</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly string[]&gt;

Success with array of matching secret names, Failure if locked
