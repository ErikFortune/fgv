[Home](../README.md) > [IWrapBytesOptions](./IWrapBytesOptions.md) > salt

## IWrapBytesOptions.salt property

HKDF salt. Domain-separates this wrap from others in different contexts.
Caller picks; common choices include a content hash, document id, channel
id, etc.

**Signature:**

```typescript
readonly salt: Uint8Array;
```
