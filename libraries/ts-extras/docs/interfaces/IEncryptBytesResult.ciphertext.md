[Home](../README.md) > [IEncryptBytesResult](./IEncryptBytesResult.md) > ciphertext

## IEncryptBytesResult.ciphertext property

The AES-256-GCM ciphertext. Same length as the input plaintext (no tag
appended — the tag is carried separately in the `authTag` field).

**Signature:**

```typescript
readonly ciphertext: Uint8Array;
```
