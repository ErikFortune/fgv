[Home](../README.md) > [IPrivateKeyStorage](./IPrivateKeyStorage.md) > store

## IPrivateKeyStorage.store() method

Stores `key` under `id`. Returns the stored `id` on success so the
call can compose into a Result chain.

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
