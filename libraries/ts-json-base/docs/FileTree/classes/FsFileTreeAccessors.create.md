[Home](../../README.md) > [FileTree](../README.md) > [FsFileTreeAccessors](./FsFileTreeAccessors.md) > create

## FsFileTreeAccessors.create() method

Creates a new FileTree.FsFileTreeAccessors | FsFileTreeAccessors.

**Signature:**

```typescript
static create(params?: IFsFileTreeInitParams<TCT>): Result<FsFileTreeAccessors<TCT>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IFsFileTreeInitParams&lt;TCT&gt;</td><td>Optional FileTree.IFsFileTreeInitParams | initialization parameters.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[FsFileTreeAccessors](../../classes/FsFileTreeAccessors.md)&lt;TCT&gt;&gt;

`Success` with the accessors, or `Failure` if `params` asks for
confinement without a `prefix`, asks for `realPath` under `'unconfined'`, or
names an unknown policy.
