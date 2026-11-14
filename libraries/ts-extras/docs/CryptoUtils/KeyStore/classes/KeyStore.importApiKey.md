[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > [KeyStore](./KeyStore.md) > importApiKey

## KeyStore.importApiKey() method

Imports an API key string into the vault.
The string is UTF-8 encoded and stored with type `'api-key'`.

**Signature:**

```typescript
importApiKey(name: string, apiKey: string, options?: IImportSecretOptions): Promise<Result<IAddSecretResult>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Unique name for the secret</td></tr>
<tr><td>apiKey</td><td>string</td><td>The API key string</td></tr>
<tr><td>options</td><td>IImportSecretOptions</td><td>Optional description, whether to replace existing</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IAddSecretResult](../../../interfaces/IAddSecretResult.md)&gt;&gt;

Success with entry, Failure if locked, empty, or exists and !replace
