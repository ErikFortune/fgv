[Home](../../README.md) > [CryptoUtils](../README.md) > [IHpkeSealResult](./IHpkeSealResult.md) > ciphertext

## IHpkeSealResult.ciphertext property

AES-256-GCM ciphertext with the 16-byte authentication tag appended.
Length = `plaintext.length + 16`.

**Signature:**

```typescript
readonly ciphertext: Uint8Array;
```
