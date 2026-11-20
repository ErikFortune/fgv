[Home](../../README.md) > [CryptoUtils](../README.md) > [NodeCryptoProvider](./NodeCryptoProvider.md) > generateHmacKey

## NodeCryptoProvider.generateHmacKey() method

Generates a fresh random 256-bit HMAC-SHA256 key with usages
`['sign', 'verify']`, non-extractable by default.

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
