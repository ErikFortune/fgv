[Home](../../README.md) > [CryptoUtils](../README.md) > [ICryptoProvider](./ICryptoProvider.md) > importKeyPairFromSeed

## ICryptoProvider.importKeyPairFromSeed() method

Derives an asymmetric keypair *deterministically* from a fixed secret seed.
The same `seed` always yields the same keypair on every runtime, so this is
the primitive to use when a keypair must be reconstructable from stored seed
material (key escrow, HD-style derivation, deterministic test vectors) rather
than freshly sampled by CryptoUtils.ICryptoProvider.generateKeyPair | generateKeyPair.

For both `'ed25519'` and `'x25519'` the private key *is* its 32-byte seed and
the public key is a deterministic function of that seed (RFC 8032 / RFC 7748),
so the returned public key is recovered even when the caller requests a
non-extractable private key. The transient extractable key used internally to
recover the public half is never returned or logged when `extractable` is
`false`. The returned keys carry the algorithm's usages: `'ed25519'` →
private `'sign'` / public `'verify'`; `'x25519'` → private `'deriveBits'` /
public no-usage (ready to hand to CryptoUtils.HpkeProvider).

**Signature:**

```typescript
importKeyPairFromSeed(algorithm: SeedDerivableAlgorithm, seed: Uint8Array, extractable: boolean): Promise<Result<CryptoKeyPair>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>algorithm</td><td>SeedDerivableAlgorithm</td><td>The CryptoUtils.SeedDerivableAlgorithm | seed-derivable algorithm
(`'ed25519'` or `'x25519'`); any other value fails loudly with context.</td></tr>
<tr><td>seed</td><td>Uint8Array</td><td>The secret seed. It must be exactly 32 bytes for both supported
algorithms; any other length fails loudly, before any WebCrypto call. The
bytes are copied, not retained or mutated.</td></tr>
<tr><td>extractable</td><td>boolean</td><td>Whether the returned private key may be exported. The
returned public key is identical for a given seed regardless of this flag.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;CryptoKeyPair&gt;&gt;

Success with the derived `CryptoKeyPair`, or Failure with error context.
