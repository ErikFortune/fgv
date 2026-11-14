[Home](../../README.md) > [CryptoUtils](../README.md) > [ICryptoProvider](./ICryptoProvider.md) > exportPublicKeyJwk

## ICryptoProvider.exportPublicKeyJwk() method

Exports the public half of a keypair as a JSON Web Key.

**Signature:**

```typescript
exportPublicKeyJwk(publicKey: CryptoKey): Promise<Result<JsonWebKey>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>publicKey</td><td>CryptoKey</td><td>The public `CryptoKey` to export. Must be an `extractable`
key generated for an asymmetric algorithm.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;JsonWebKey&gt;&gt;

Success with the JWK, or Failure with error context.
