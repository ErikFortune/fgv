[Home](../README.md) > [ICryptoProvider](./ICryptoProvider.md) > fromBase64

## ICryptoProvider.fromBase64() method

Decodes base64 string to binary data.

**Signature:**

```typescript
fromBase64(base64: string): Result<Uint8Array<ArrayBufferLike>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>base64</td><td>string</td><td>Base64-encoded string</td></tr>
</tbody></table>

**Returns:**

Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;

Success with decoded bytes, or Failure if invalid base64
