[Home](../README.md) > [BrowserCryptoProvider](./BrowserCryptoProvider.md) > importPublicKeyJwk

## BrowserCryptoProvider.importPublicKeyJwk() method

Imports a public-key JWK as a `CryptoKey` for the requested algorithm.

**Signature:**

```typescript
importPublicKeyJwk(jwk: JsonWebKey, algorithm: KeyPairAlgorithm): Promise<Result<CryptoKey>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>jwk</td><td>JsonWebKey</td><td>The JSON Web Key produced by a prior export.</td></tr>
<tr><td>algorithm</td><td>KeyPairAlgorithm</td><td>The algorithm the key was generated for.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;CryptoKey&gt;&gt;

`Success` with the imported public `CryptoKey`, or `Failure` with an error.
