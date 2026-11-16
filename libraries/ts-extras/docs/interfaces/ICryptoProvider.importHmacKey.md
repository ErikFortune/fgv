[Home](../README.md) > [ICryptoProvider](./ICryptoProvider.md) > importHmacKey

## ICryptoProvider.importHmacKey() method

Imports raw key bytes as an HMAC-SHA256 key.

Use this for key material obtained elsewhere, including the output of
`deriveKey`. Refuses a key shorter than
`Constants.HMAC_SHA256_KEY_SIZE`
bytes (RFC 2104's `L` for SHA-256). The key carries usages
`['sign', 'verify']` and is non-extractable unless `options.extractable`
is `true`.

**Signature:**

```typescript
importHmacKey(raw: Uint8Array, options?: IHmacKeyOptions): Promise<Result<CryptoKey>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>raw</td><td>Uint8Array</td><td>The raw key bytes (at least 32).</td></tr>
<tr><td>options</td><td>IHmacKeyOptions</td><td>Optional `IHmacKeyOptions`.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;CryptoKey&gt;&gt;

`Success` with the HMAC `CryptoKey`, or `Failure` with error context.
