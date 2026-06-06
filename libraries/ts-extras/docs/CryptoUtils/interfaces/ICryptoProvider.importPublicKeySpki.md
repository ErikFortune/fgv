[Home](../../README.md) > [CryptoUtils](../README.md) > [ICryptoProvider](./ICryptoProvider.md) > importPublicKeySpki

## ICryptoProvider.importPublicKeySpki() method

Imports a public key from a DER-encoded SPKI blob.

**Signature:**

```typescript
importPublicKeySpki(spkiBytes: Uint8Array, algorithm: KeyPairAlgorithm): Promise<Result<CryptoKey>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spkiBytes</td><td>Uint8Array</td><td>The raw SPKI bytes produced by CryptoUtils.ICryptoProvider.exportPublicKeySpki | exportPublicKeySpki.</td></tr>
<tr><td>algorithm</td><td>KeyPairAlgorithm</td><td>The CryptoUtils.KeyPairAlgorithm | algorithm the key was generated for.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;CryptoKey&gt;&gt;

`Success` with the imported public `CryptoKey`, or `Failure` with error context.
