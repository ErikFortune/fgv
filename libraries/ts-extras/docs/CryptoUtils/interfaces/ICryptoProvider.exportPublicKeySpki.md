[Home](../../README.md) > [CryptoUtils](../README.md) > [ICryptoProvider](./ICryptoProvider.md) > exportPublicKeySpki

## ICryptoProvider.exportPublicKeySpki() method

Exports a public `CryptoKey` as a DER-encoded SPKI (SubjectPublicKeyInfo) blob.
SPKI is the standard algorithm-agnostic format for public key storage and transport.

**Signature:**

```typescript
exportPublicKeySpki(publicKey: CryptoKey): Promise<Result<Uint8Array<ArrayBufferLike>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>publicKey</td><td>CryptoKey</td><td>The `CryptoKey` to export. Must have `key.type === 'public'`.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;&gt;

`Success` with the raw SPKI bytes, or `Failure` with error context.
