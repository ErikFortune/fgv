[Home](../README.md) > [BrowserCryptoProvider](./BrowserCryptoProvider.md) > sha256

## BrowserCryptoProvider.sha256() method

Computes a SHA-256 hash of the given data.

**Signature:**

```typescript
sha256(data: string): Promise<Result<string>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>data</td><td>string</td><td>UTF-8 string to hash</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;string&gt;&gt;

`Success` with hex-encoded hash string, or `Failure` with an error.
