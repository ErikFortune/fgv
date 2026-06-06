[Home](../../README.md) > [KeyStore](../README.md) > [IPrivateKeyStorage](./IPrivateKeyStorage.md) > load

## IPrivateKeyStorage.load() method

Loads the private key previously stored under `id`.

**Signature:**

```typescript
load(id: string): Promise<Result<CryptoKey>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>string</td><td>Storage handle to look up.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;CryptoKey&gt;&gt;
