[Home](../../README.md) > [CryptoUtils](../README.md) > [IdbPrivateKeyStorage](./IdbPrivateKeyStorage.md) > delete

## IdbPrivateKeyStorage.delete() method

Deletes the entry stored under `id`. Missing ids fail, mirroring the
encrypted-file backend. The existence check and the delete run in separate
transactions (single-tab assumption).

**Signature:**

```typescript
delete(id: string): Promise<Result<string>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>string</td><td>Storage handle to remove.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;string&gt;&gt;
