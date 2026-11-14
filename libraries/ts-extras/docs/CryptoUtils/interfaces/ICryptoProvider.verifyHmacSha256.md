[Home](../../README.md) > [CryptoUtils](../README.md) > [ICryptoProvider](./ICryptoProvider.md) > verifyHmacSha256

## ICryptoProvider.verifyHmacSha256() method

Verifies an HMAC-SHA256 authentication code in constant time.

Computes the expected MAC over `data` with `key`, then compares it to
`signature` using ICryptoProvider.timingSafeEqual so that
mismatches do not leak information through timing.

**Signature:**

```typescript
verifyHmacSha256(key: CryptoKey, signature: Uint8Array, data: Uint8Array): Promise<Result<boolean>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>CryptoKey</td><td>An HMAC `CryptoKey` with `'sign'` usage.</td></tr>
<tr><td>signature</td><td>Uint8Array</td><td>The MAC bytes to verify (typically 32 bytes).</td></tr>
<tr><td>data</td><td>Uint8Array</td><td>The original data that was authenticated.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;boolean&gt;&gt;

`Success` with `true` if the MAC is valid, `false` if it is not,
or `Failure` with error context if the MAC computation itself failed.
