[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > [IPrivateKeyStorage](./IPrivateKeyStorage.md) > delete

## IPrivateKeyStorage.delete() method

Deletes the entry stored under `id`. Returns the deleted `id` on
success so the call can compose into a Result chain.

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
