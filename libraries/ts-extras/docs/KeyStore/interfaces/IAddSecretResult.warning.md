[Home](../../README.md) > [KeyStore](../README.md) > [IAddSecretResult](./IAddSecretResult.md) > warning

## IAddSecretResult.warning property

Best-effort warning from displaced-resource cleanup. Set when this call
replaced an asymmetric-keypair entry but the corresponding
CryptoUtils.KeyStore.IPrivateKeyStorage.delete failed; the new
entry is still committed and the orphaned blob is left for consumer-side
GC to reconcile.

**Signature:**

```typescript
readonly warning: string;
```
