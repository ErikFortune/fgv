[Home](../../README.md) > [CryptoUtils](../README.md) > [KeyStore](./KeyStore.md) > hasSecret

## KeyStore.hasSecret() method

Checks if a secret exists.

**Signature:**

```typescript
hasSecret(name: string): Result<boolean>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Name of the secret</td></tr>
</tbody></table>

**Returns:**

Result&lt;boolean&gt;

Success with boolean, Failure if locked
