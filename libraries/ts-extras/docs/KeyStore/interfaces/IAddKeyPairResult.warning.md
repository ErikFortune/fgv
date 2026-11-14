[Home](../../README.md) > [KeyStore](../README.md) > [IAddKeyPairResult](./IAddKeyPairResult.md) > warning

## IAddKeyPairResult.warning property

Best-effort warning from displaced-resource cleanup. Set when this call
replaced a prior entry but the corresponding
CryptoUtils.KeyStore.IPrivateKeyStorage.delete failed; the new
keypair is still committed and the orphaned blob is left for consumer-side
GC to reconcile.

**Signature:**

```typescript
readonly warning: string;
```
