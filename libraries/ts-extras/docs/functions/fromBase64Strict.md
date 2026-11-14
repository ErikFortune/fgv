[Home](../README.md) > fromBase64Strict

# Function: fromBase64Strict

Decodes a base64 string to a `Uint8Array`, **rejecting input that is not
well-formed base64** instead of silently salvaging what it can.

## Signature

```typescript
function fromBase64Strict(base64: string): Result<Uint8Array<ArrayBufferLike>>
```
