[Home](../README.md) > [IArgon2idKeyingOptions](./IArgon2idKeyingOptions.md) > associatedData

## IArgon2idKeyingOptions.associatedData property

Optional associated data X (RFC 9106 §3.1). When present and non-empty it is
mixed into the hash. **Node-only:** the WASM (`hash-wasm`) browser backend
has no associated-data input, so `BrowserArgon2Provider` fails loudly rather
than silently dropping it (which would produce wrong bytes). Empty or omitted
means no associated data and is accepted by both backends.

**Signature:**

```typescript
readonly associatedData: Uint8Array<ArrayBufferLike>;
```
