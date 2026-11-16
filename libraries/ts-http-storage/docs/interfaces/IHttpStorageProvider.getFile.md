[Home](../README.md) > [IHttpStorageProvider](./IHttpStorageProvider.md) > getFile

## IHttpStorageProvider.getFile() method

Reads a file.

**Signature:**

```typescript
getFile(path: string, encoding?: StorageContentEncoding): Promise<Result<IStorageFileResponse>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td>Path of the file to read.</td></tr>
<tr><td>encoding</td><td>StorageContentEncoding</td><td>Preferred wire encoding for the returned `contents`. A
provider that does not implement the requested encoding MUST answer in
`'utf8'` and report that on the response, rather than failing — the field is
a preference and the response is the authority.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IStorageFileResponse](IStorageFileResponse.md)&gt;&gt;
