[Home](../../README.md) > [CryptoUtils](../README.md) > [NodeCryptoProvider](./NodeCryptoProvider.md) > verifyHmacSha256

## NodeCryptoProvider.verifyHmacSha256() method

Verifies an HMAC-SHA256 MAC in constant time.

**Signature:**

```typescript
verifyHmacSha256(key: CryptoKey, signature: Uint8Array, data: Uint8Array): Promise<Result<boolean>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>CryptoKey</td><td>An HMAC `CryptoKey` with `'sign'` usage.</td></tr>
<tr><td>signature</td><td>Uint8Array</td><td>The MAC bytes to verify.</td></tr>
<tr><td>data</td><td>Uint8Array</td><td>The original data that was authenticated.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;boolean&gt;&gt;

`Success` with `true` if valid, `false` if not, or `Failure` with error context.
