[Home](../../README.md) > [CryptoUtils](../README.md) > [IRemoveSecretResult](./IRemoveSecretResult.md) > warning

## IRemoveSecretResult.warning property

Best-effort warning from CryptoUtils.KeyStore.IPrivateKeyStorage.delete
for asymmetric entries when the storage call failed. The vault entry is
still considered removed and the orphaned blob is left for consumer-side
GC to reconcile.

**Signature:**

```typescript
readonly warning: string;
```
