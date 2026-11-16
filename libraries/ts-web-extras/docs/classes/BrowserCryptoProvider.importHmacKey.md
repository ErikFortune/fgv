[Home](../README.md) > [BrowserCryptoProvider](./BrowserCryptoProvider.md) > importHmacKey

## BrowserCryptoProvider.importHmacKey() method

Imports raw key bytes as an HMAC-SHA256 key with usages
`['sign', 'verify']`, non-extractable by default. Refuses keys shorter
than `CryptoUtils.Constants.HMAC_SHA256_KEY_SIZE` bytes.

**Signature:**

```typescript
importHmacKey(raw: Uint8Array, options?: IHmacKeyOptions): Promise<Result<CryptoKey>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>raw</td><td>Uint8Array</td><td>The raw key bytes.</td></tr>
<tr><td>options</td><td>IHmacKeyOptions</td><td>Optional `IHmacKeyOptions`.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;CryptoKey&gt;&gt;

`Success` with the HMAC `CryptoKey`, or `Failure` with error context.
