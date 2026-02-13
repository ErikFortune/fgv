[Home](../README.md) > [IPlatformInitializer](./IPlatformInitializer.md) > resolveExternalLibrary

## IPlatformInitializer.resolveExternalLibrary() method

Resolves an external library reference to a FileTree.

**Signature:**

```typescript
resolveExternalLibrary(ref: ExternalLibraryRef, config: IExternalLibraryRefConfig): Result<IFileTreeDirectoryItem<string>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>ref</td><td>ExternalLibraryRef</td><td>The external library reference (path or URI)</td></tr>
<tr><td>config</td><td>IExternalLibraryRefConfig</td><td>The full external library configuration</td></tr>
</tbody></table>

**Returns:**

Result&lt;IFileTreeDirectoryItem&lt;string&gt;&gt;

Success with file tree, or Failure if resolution fails
