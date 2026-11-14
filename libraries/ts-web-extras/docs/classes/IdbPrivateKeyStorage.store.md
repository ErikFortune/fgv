[Home](../README.md) > [IdbPrivateKeyStorage](./IdbPrivateKeyStorage.md) > store

## IdbPrivateKeyStorage.store() method

Stores `key` under `id`.

**Signature:**

```typescript
store(id: string, key: CryptoKey): Promise<Result<string>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>string</td><td>Storage handle to write under.</td></tr>
<tr><td>key</td><td>CryptoKey</td><td>The private `CryptoKey` to persist.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;string&gt;&gt;
