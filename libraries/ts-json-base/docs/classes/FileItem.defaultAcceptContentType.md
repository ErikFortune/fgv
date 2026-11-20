[Home](../README.md) > [FileItem](./FileItem.md) > defaultAcceptContentType

## FileItem.defaultAcceptContentType() method

Default function to accept the content type of a file.

**Signature:**

```typescript
static defaultAcceptContentType(filePath: string, provided?: TCT): Result<TCT | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>filePath</td><td>string</td><td>The path of the file.</td></tr>
<tr><td>provided</td><td>TCT</td><td>Optional supplied content type.</td></tr>
</tbody></table>

**Returns:**

Result&lt;TCT | undefined&gt;

`Success` with the content type of the file if successful, or
`Failure` with an error message otherwise.
