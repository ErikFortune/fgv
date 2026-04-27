[Home](../../README.md) > [CryptoUtils](../README.md) > [IWrappedBytes](./IWrappedBytes.md) > ciphertext

## IWrappedBytes.ciphertext property

AES-GCM ciphertext concatenated with the 16-byte authentication tag,
base64-encoded. Tampering with either the nonce or the ciphertext causes
unwrap to fail GCM authentication.

**Signature:**

```typescript
readonly ciphertext: string;
```
