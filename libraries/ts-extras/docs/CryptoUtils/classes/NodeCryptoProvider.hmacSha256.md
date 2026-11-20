[Home](../../README.md) > [CryptoUtils](../README.md) > [NodeCryptoProvider](./NodeCryptoProvider.md) > hmacSha256

## NodeCryptoProvider.hmacSha256() method

Computes an HMAC-SHA256 MAC for `data` using `key`.

**Signature:**

```typescript
hmacSha256(key: CryptoKey, data: Uint8Array): Promise<Result<Uint8Array<ArrayBufferLike>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>CryptoKey</td><td>An HMAC `CryptoKey` with `'sign'` usage.</td></tr>
<tr><td>data</td><td>Uint8Array</td><td>The bytes to authenticate.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;&gt;

`Success` with the 32-byte MAC, or `Failure` with error context.
