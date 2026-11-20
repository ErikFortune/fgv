[Home](../../README.md) > [CryptoUtils](../README.md) > [KeyStore](./KeyStore.md) > getApiKey

## KeyStore.getApiKey() method

Retrieves an API key string by name.
Only works for secrets with type `'api-key'`.

**Signature:**

```typescript
getApiKey(name: string): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Name of the secret</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

Success with the API key string, Failure if not found, locked, or wrong type
