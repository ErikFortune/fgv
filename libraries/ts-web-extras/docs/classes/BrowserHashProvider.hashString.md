[Home](../README.md) > [BrowserHashProvider](./BrowserHashProvider.md) > hashString

## BrowserHashProvider.hashString() method

Hash a string using the specified algorithm.

**Signature:**

```typescript
static hashString(data: string, algorithm: string): Promise<Result<string>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>data</td><td>string</td><td>The string to hash</td></tr>
<tr><td>algorithm</td><td>string</td><td>The hash algorithm to use</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;string&gt;&gt;

Promise resolving to the hex-encoded hash
