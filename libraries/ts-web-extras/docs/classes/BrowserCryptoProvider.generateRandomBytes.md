[Home](../README.md) > [BrowserCryptoProvider](./BrowserCryptoProvider.md) > generateRandomBytes

## BrowserCryptoProvider.generateRandomBytes() method

Generates cryptographically secure random bytes.

**Signature:**

```typescript
generateRandomBytes(length: number): Result<Uint8Array<ArrayBufferLike>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>length</td><td>number</td><td>Number of bytes to generate</td></tr>
</tbody></table>

**Returns:**

Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;

Success with random bytes, or Failure with error
