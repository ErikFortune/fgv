[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > [KeyStore](./KeyStore.md) > importSecret

## KeyStore.importSecret() method

Imports raw 32-byte key material into the vault.

Always validates that the key is exactly 32 bytes (AES-256). The optional
`type` field is a classification label stored with the entry; it does not
change the validation rules.  For importing UTF-8 API key strings (variable
length), use KeyStore.importApiKey instead.

**Signature:**

```typescript
importSecret(name: string, key: Uint8Array, options?: IImportKeyOptions): Promise<Result<IAddSecretResult>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Unique name for the secret</td></tr>
<tr><td>key</td><td>Uint8Array</td><td>The 32-byte AES-256 key material</td></tr>
<tr><td>options</td><td>IImportKeyOptions</td><td>Optional type classification, description, whether to replace existing</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IAddSecretResult](../../../interfaces/IAddSecretResult.md)&gt;&gt;

Success with entry, Failure if locked, key invalid, or exists and !replace
