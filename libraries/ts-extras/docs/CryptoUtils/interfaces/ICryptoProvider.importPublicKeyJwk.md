[Home](../../README.md) > [CryptoUtils](../README.md) > [ICryptoProvider](./ICryptoProvider.md) > importPublicKeyJwk

## ICryptoProvider.importPublicKeyJwk() method

Re-imports a public-key JWK as a `CryptoKey` usable for verification or
encryption (depending on algorithm).

**Signature:**

```typescript
importPublicKeyJwk(jwk: JsonWebKey, algorithm: KeyPairAlgorithm): Promise<Result<CryptoKey>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>jwk</td><td>JsonWebKey</td><td>The JSON Web Key produced by CryptoUtils.ICryptoProvider.exportPublicKeyJwk | exportPublicKeyJwk.</td></tr>
<tr><td>algorithm</td><td>KeyPairAlgorithm</td><td>The CryptoUtils.KeyPairAlgorithm | algorithm the
key was generated for. Determines the import parameters and key usages.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;CryptoKey&gt;&gt;

Success with the imported public `CryptoKey`, or Failure with error context.
