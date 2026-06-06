[Home](../README.md) > [IdbPrivateKeyStorage](./IdbPrivateKeyStorage.md) > create

## IdbPrivateKeyStorage.create() method

Creates a new CryptoUtils.IdbPrivateKeyStorage.

**Signature:**

```typescript
static create(params: IIdbPrivateKeyStorageCreateParams): Result<IdbPrivateKeyStorage>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IIdbPrivateKeyStorageCreateParams</td><td>Optional CryptoUtils.IIdbPrivateKeyStorageCreateParams.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IdbPrivateKeyStorage](IdbPrivateKeyStorage.md)&gt;

`Success` with the new instance, or `Failure` if no IndexedDB
factory is available.
