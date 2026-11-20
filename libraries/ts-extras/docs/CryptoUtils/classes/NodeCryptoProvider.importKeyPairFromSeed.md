[Home](../../README.md) > [CryptoUtils](../README.md) > [NodeCryptoProvider](./NodeCryptoProvider.md) > importKeyPairFromSeed

## NodeCryptoProvider.importKeyPairFromSeed() method

Derives an asymmetric keypair deterministically from a fixed secret seed.

**Signature:**

```typescript
importKeyPairFromSeed(algorithm: SeedDerivableAlgorithm, seed: Uint8Array, extractable: boolean): Promise<Result<CryptoKeyPair>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>algorithm</td><td>SeedDerivableAlgorithm</td><td>The seed-derivable algorithm (only `'ed25519'` today).</td></tr>
<tr><td>seed</td><td>Uint8Array</td><td>The 32-byte secret seed.</td></tr>
<tr><td>extractable</td><td>boolean</td><td>Whether the returned private key may be exported.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;CryptoKeyPair&gt;&gt;

`Success` with the derived `CryptoKeyPair`, or `Failure` with an error.
