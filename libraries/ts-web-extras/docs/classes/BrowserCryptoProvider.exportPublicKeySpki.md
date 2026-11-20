[Home](../README.md) > [BrowserCryptoProvider](./BrowserCryptoProvider.md) > exportPublicKeySpki

## BrowserCryptoProvider.exportPublicKeySpki() method

Exports a public `CryptoKey` as a DER-encoded SPKI blob.

**Signature:**

```typescript
exportPublicKeySpki(publicKey: CryptoKey): Promise<Result<Uint8Array<ArrayBufferLike>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>publicKey</td><td>CryptoKey</td><td>The public `CryptoKey` to export.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;&gt;

`Success` with the raw SPKI bytes, or `Failure` with error context.
