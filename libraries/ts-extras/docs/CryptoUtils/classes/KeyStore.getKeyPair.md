[Home](../../README.md) > [CryptoUtils](../README.md) > [KeyStore](./KeyStore.md) > getKeyPair

## KeyStore.getKeyPair() method

Retrieves the keypair for an asymmetric-keypair entry. The private key is
loaded from CryptoUtils.KeyStore.IPrivateKeyStorage on every call —
the keystore never caches private `CryptoKey` references between calls.
The public key is re-imported from the vault's JWK so callers always
receive a `CryptoKey` rather than the JWK form.

**Signature:**

```typescript
getKeyPair(name: string): Promise<Result<{ publicKey: CryptoKey; privateKey: CryptoKey }>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Name of the entry</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;{ publicKey: CryptoKey; privateKey: CryptoKey }&gt;&gt;

Success with `{ publicKey, privateKey }`, Failure if not found,
locked, wrong type, no provider, or storage load failed.
