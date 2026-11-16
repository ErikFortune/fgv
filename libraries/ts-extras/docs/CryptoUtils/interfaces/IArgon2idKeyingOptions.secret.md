[Home](../../README.md) > [CryptoUtils](../README.md) > [IArgon2idKeyingOptions](./IArgon2idKeyingOptions.md) > secret

## IArgon2idKeyingOptions.secret property

Optional secret key K (RFC 9106 keyed hashing, sometimes called a "pepper").
When present and non-empty it is mixed into the hash so that the derived
output cannot be reproduced without also knowing K. Empty or omitted means
no secret. Honored by both the Node and browser backends.

**Signature:**

```typescript
readonly secret: Uint8Array<ArrayBufferLike>;
```
