[Home](../README.md) > [ICryptoProvider](./ICryptoProvider.md) > generateKeyPair

## ICryptoProvider.generateKeyPair() method

Generates a new asymmetric keypair for the requested algorithm.

**Signature:**

```typescript
generateKeyPair(algorithm: KeyPairAlgorithm, extractable: boolean): Promise<Result<CryptoKeyPair>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>algorithm</td><td>KeyPairAlgorithm</td><td>The CryptoUtils.KeyPairAlgorithm | algorithm to use.</td></tr>
<tr><td>extractable</td><td>boolean</td><td>Whether the resulting `CryptoKey` objects may be exported.
Set `false` on backends that store `CryptoKey` references directly (e.g.
IndexedDB). Set `true` when the private key must round-trip through JWK or
PKCS#8 (e.g. encrypted-file backends).</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;CryptoKeyPair&gt;&gt;

Success with the generated `CryptoKeyPair`, or Failure with error context.
