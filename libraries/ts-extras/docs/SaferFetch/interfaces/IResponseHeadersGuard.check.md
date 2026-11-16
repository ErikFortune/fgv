[Home](../../README.md) > [SaferFetch](../README.md) > [IResponseHeadersGuard](./IResponseHeadersGuard.md) > check

## IResponseHeadersGuard.check() method

**Signature:**

```typescript
check(head: ISaferFetchResponseHead, chain: readonly IRequestHop[]): Promise<Result<true>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>head</td><td>ISaferFetchResponseHead</td><td></td></tr>
<tr><td>chain</td><td>readonly IRequestHop[]</td><td></td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;true&gt;&gt;
