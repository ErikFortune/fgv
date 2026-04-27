[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > [KeyStore](./KeyStore.md) > getPublicKeyJwk

## KeyStore.getPublicKeyJwk() method

Returns the public-key JWK for an asymmetric-keypair entry.
Available without CryptoUtils.KeyStore.IPrivateKeyStorage since the
public key lives in the vault metadata directly.

**Signature:**

```typescript
getPublicKeyJwk(name: string): Result<JsonWebKey>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Name of the entry</td></tr>
</tbody></table>

**Returns:**

Result&lt;JsonWebKey&gt;

Success with the JWK, Failure if not found, locked, or wrong type
