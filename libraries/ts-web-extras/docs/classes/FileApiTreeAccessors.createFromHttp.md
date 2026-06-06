[Home](../README.md) > [FileApiTreeAccessors](./FileApiTreeAccessors.md) > createFromHttp

## FileApiTreeAccessors.createFromHttp() method

Create a persistent FileTree from an HTTP storage service.

**Signature:**

```typescript
static createFromHttp(params: IHttpTreeParams<TCT>): Promise<Result<FileTree_2<TCT>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IHttpTreeParams&lt;TCT&gt;</td><td>Configuration including API base URL, namespace, and optional autoSync</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;FileTree_2&lt;TCT&gt;&gt;&gt;

Promise resolving to a FileTree with persistence capability
