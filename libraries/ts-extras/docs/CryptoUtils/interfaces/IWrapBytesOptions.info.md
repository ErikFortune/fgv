[Home](../../README.md) > [CryptoUtils](../README.md) > [IWrapBytesOptions](./IWrapBytesOptions.md) > info

## IWrapBytesOptions.info property

HKDF info. Further binds the derived key to a specific use within the
calling application. Caller picks; common choices include a secret name,
message type, or version tag.

**Signature:**

```typescript
readonly info: Uint8Array;
```
