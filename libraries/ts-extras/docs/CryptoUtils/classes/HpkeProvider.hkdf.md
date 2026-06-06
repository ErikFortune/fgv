[Home](../../README.md) > [CryptoUtils](../README.md) > [HpkeProvider](./HpkeProvider.md) > hkdf

## HpkeProvider.hkdf() method

HKDF-SHA256 key derivation (RFC 5869). Extract-then-Expand using SHA-256.

This is raw RFC 5869 HKDF — it does **not** use RFC 9180's labeled variants.
The HPKE key schedule internally uses labeled HKDF; this method is the unlabeled
version for callers that need standalone key derivation.

**Signature:**

```typescript
hkdf(secret: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number): Promise<Result<Uint8Array<ArrayBufferLike>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>secret</td><td>Uint8Array</td><td>Input keying material (IKM). Any length.</td></tr>
<tr><td>salt</td><td>Uint8Array</td><td>Optional salt. Use `new Uint8Array(0)` if no salt is available
  (RFC 5869: 32 zero bytes are used internally when salt is empty).</td></tr>
<tr><td>info</td><td>Uint8Array</td><td>Context / application-binding bytes. Any length.</td></tr>
<tr><td>length</td><td>number</td><td>Number of output bytes to derive. Maximum 8160 bytes (255 × 32).</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;&gt;

`Success` with derived bytes, or `Failure` with error context.
