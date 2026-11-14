[Home](../README.md) > [BrowserCryptoProvider](./BrowserCryptoProvider.md) > sign

## BrowserCryptoProvider.sign() method

Signs `data` with `privateKey` using the algorithm inferred from the key.

**Signature:**

```typescript
sign(privateKey: CryptoKey, data: Uint8Array): Promise<Result<Uint8Array<ArrayBufferLike>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>privateKey</td><td>CryptoKey</td><td>A signing `CryptoKey` (`'ecdsa-p256'` or `'ed25519'`).</td></tr>
<tr><td>data</td><td>Uint8Array</td><td>The bytes to sign.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;&gt;

`Success` with the raw signature bytes, or `Failure` with error context.
