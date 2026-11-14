[Home](../../README.md) > [CryptoUtils](../README.md) > [ICryptoProvider](./ICryptoProvider.md) > generateHmacKey

## ICryptoProvider.generateHmacKey() method

Generates a fresh random HMAC-SHA256 key.

The key is exactly `Constants.HMAC_SHA256_KEY_SIZE`
bytes (256 bits), carries usages `['sign', 'verify']`, and is
non-extractable unless `options.extractable` is `true`.

**Signature:**

```typescript
generateHmacKey(options?: IHmacKeyOptions): Promise<Result<CryptoKey>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>IHmacKeyOptions</td><td>Optional `IHmacKeyOptions`.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;CryptoKey&gt;&gt;

`Success` with the HMAC `CryptoKey`, or `Failure` with error context.
