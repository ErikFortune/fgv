[Home](../../README.md) > [KeyStore](../README.md) > [IAddKeyPairOptions](./IAddKeyPairOptions.md) > replace

## IAddKeyPairOptions.replace property

Whether to replace an existing entry with the same name.
Replacement mints a fresh storage `id` and best-effort deletes the
displaced storage blob; see the keystore design doc for details.

**Signature:**

```typescript
readonly replace: boolean;
```
