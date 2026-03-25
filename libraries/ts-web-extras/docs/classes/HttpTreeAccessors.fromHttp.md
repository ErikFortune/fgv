[Home](../README.md) > [HttpTreeAccessors](./HttpTreeAccessors.md) > fromHttp

## HttpTreeAccessors.fromHttp() method

Creates a new HttpTreeAccessors instance from an HTTP backend.

**Signature:**

```typescript
static fromHttp(params: IHttpTreeParams<TCT>): Promise<Result<HttpTreeAccessors<TCT>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IHttpTreeParams&lt;TCT&gt;</td><td>Configuration parameters for the HTTP tree accessors.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[HttpTreeAccessors](HttpTreeAccessors.md)&lt;TCT&gt;&gt;&gt;

A promise that resolves to a result containing the new HttpTreeAccessors instance or an error message.
