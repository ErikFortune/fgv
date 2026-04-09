[Home](../../README.md) > [CryptoUtils](../README.md) > [KeyStore](./KeyStore.md) > importSecret

## KeyStore.importSecret() method

Imports an existing secret key.

**Signature:**

```typescript
importSecret(name: string, key: Uint8Array, options?: IImportSecretOptions): Result<IAddSecretResult>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Unique name for the secret</td></tr>
<tr><td>key</td><td>Uint8Array</td><td>The 32-byte AES-256 key</td></tr>
<tr><td>options</td><td>IImportSecretOptions</td><td>Optional type, description, whether to replace existing</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IAddSecretResult](../../interfaces/IAddSecretResult.md)&gt;

Success with entry, Failure if locked, key invalid, or exists and !replace
