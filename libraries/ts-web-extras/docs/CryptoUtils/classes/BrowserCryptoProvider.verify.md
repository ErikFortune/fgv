[Home](../../README.md) > [CryptoUtils](../README.md) > [BrowserCryptoProvider](./BrowserCryptoProvider.md) > verify

## BrowserCryptoProvider.verify() method

Verifies a signature produced by BrowserCryptoProvider.sign.

**Signature:**

```typescript
verify(publicKey: CryptoKey, signature: Uint8Array, data: Uint8Array): Promise<Result<boolean>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>publicKey</td><td>CryptoKey</td><td>A verify `CryptoKey` (`'ecdsa-p256'` or `'ed25519'`).</td></tr>
<tr><td>signature</td><td>Uint8Array</td><td>The raw signature bytes.</td></tr>
<tr><td>data</td><td>Uint8Array</td><td>The original data that was signed.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;boolean&gt;&gt;

`Success` with `true` if valid, `false` if not, or `Failure` with error context.
