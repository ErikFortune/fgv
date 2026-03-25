[Home](../../README.md) > [ZipFileTree](../README.md) > [ZipFileTreeAccessors](./ZipFileTreeAccessors.md) > defaultInferContentType

## ZipFileTreeAccessors.defaultInferContentType() method

Default function to infer the content type of a file.

**Signature:**

```typescript
static defaultInferContentType(__filePath: string, __provided?: string): Result<TCT | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>__filePath</td><td>string</td><td></td></tr>
<tr><td>__provided</td><td>string</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;TCT | undefined&gt;

`Success` with the content type of the file if successful, or
`Failure` with an error message otherwise.
