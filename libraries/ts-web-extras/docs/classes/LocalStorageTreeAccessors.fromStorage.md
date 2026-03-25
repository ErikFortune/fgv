[Home](../README.md) > [LocalStorageTreeAccessors](./LocalStorageTreeAccessors.md) > fromStorage

## LocalStorageTreeAccessors.fromStorage() method

Create LocalStorageTreeAccessors from browser localStorage.
Loads all collections from the configured storage keys.

**Signature:**

```typescript
static fromStorage(params: ILocalStorageTreeParams<TCT>): Result<LocalStorageTreeAccessors<TCT>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>ILocalStorageTreeParams&lt;TCT&gt;</td><td>Configuration including path-to-key mappings</td></tr>
</tbody></table>

**Returns:**

Result&lt;[LocalStorageTreeAccessors](LocalStorageTreeAccessors.md)&lt;TCT&gt;&gt;

Result containing the accessors or an error
