[Home](../../README.md) > [CryptoUtils](../README.md) > [NodeCryptoProvider](./NodeCryptoProvider.md) > exportPublicKeyJwk

## NodeCryptoProvider.exportPublicKeyJwk() method

Exports a public `CryptoKey` as a JSON Web Key.

**Signature:**

```typescript
exportPublicKeyJwk(publicKey: CryptoKey): Promise<Result<JsonWebKey>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>publicKey</td><td>CryptoKey</td><td>Extractable public key to export.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;JsonWebKey&gt;&gt;

`Success` with the JWK, or `Failure` if not a public key or if export fails.
