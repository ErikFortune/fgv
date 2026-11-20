[Home](../../README.md) > [KeyStore](../README.md) > [IAddKeyPairOptions](./IAddKeyPairOptions.md) > escrow

## IAddKeyPairOptions.escrow property

Opt in to private-key escrow. When `true`, an encrypted copy of the
private key (as a JWK) is carried inside the vault entry
(`escrowedPrivateKeyJwk`), enabling cross-device recovery from the vault
file plus the master password alone via
`getKeyPair(name, { rehydrate: true })`.

Orthogonal to `extractable`: the escrow copy is always captured (the
transient keypair is generated extractable so it can be exported to JWK),
while the LIVE stored key's extractability still follows the normal rule
(`extractable` override, else the backend default). So escrow does not
change how extractable the day-to-day key is — only whether a recovery
copy is retained in the vault.

**Signature:**

```typescript
readonly escrow: boolean;
```
