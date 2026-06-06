[Home](../../README.md) > [CryptoUtils](../README.md) > [ICryptoProvider](./ICryptoProvider.md) > hmacSha256

## ICryptoProvider.hmacSha256() method

Computes an HMAC-SHA256 authentication code for `data` using `key`.

The key must be a `CryptoKey` with `'sign'` usage and algorithm name
`'HMAC'` (e.g. derived via PBKDF2 or imported with
`crypto.subtle.importKey`). Use ICryptoProvider.verifyHmacSha256
for constant-time verification of the output.

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
