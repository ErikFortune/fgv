[Home](../README.md) > [BrowserHashProvider](./BrowserHashProvider.md) > hashParts

## BrowserHashProvider.hashParts() method

Hash multiple strings concatenated with a separator.

**Signature:**

```typescript
static hashParts(parts: string[], algorithm: string, separator: string): Promise<Result<string>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>parts</td><td>string[]</td><td>Array of strings to concatenate and hash</td></tr>
<tr><td>algorithm</td><td>string</td><td>The hash algorithm to use</td></tr>
<tr><td>separator</td><td>string</td><td>Separator to use between parts (default: '|')</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;string&gt;&gt;

Promise resolving to the hex-encoded hash
