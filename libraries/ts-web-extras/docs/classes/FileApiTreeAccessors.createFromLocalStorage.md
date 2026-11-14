[Home](../README.md) > [FileApiTreeAccessors](./FileApiTreeAccessors.md) > createFromLocalStorage

## FileApiTreeAccessors.createFromLocalStorage() method

Create a persistent FileTree from browser localStorage.
Changes to files can be synced back to localStorage.

**Signature:**

```typescript
static createFromLocalStorage(params: ILocalStorageTreeParams<TCT>): Result<FileTree_2<TCT>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>ILocalStorageTreeParams&lt;TCT&gt;</td><td>Configuration including path-to-key mappings and optional autoSync</td></tr>
</tbody></table>

**Returns:**

Result&lt;FileTree_2&lt;TCT&gt;&gt;

Result containing a FileTree with persistence capability
