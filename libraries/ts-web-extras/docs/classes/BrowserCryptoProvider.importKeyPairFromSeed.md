[Home](../README.md) > [BrowserCryptoProvider](./BrowserCryptoProvider.md) > importKeyPairFromSeed

## BrowserCryptoProvider.importKeyPairFromSeed() method

Derives an asymmetric keypair deterministically from a fixed secret seed.

Unlike the surrounding browser-only methods, this is a pure delegation to
`CryptoUtils.deriveKeyPairFromSeed` which touches only
`globalThis.crypto.subtle` (no DOM-only surface), so it is exercised and
measured in plain Node/Jest — hence it sits outside the `c8 ignore` region.

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
