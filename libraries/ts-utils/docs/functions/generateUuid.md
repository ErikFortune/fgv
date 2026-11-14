[Home](../README.md) > generateUuid

# Function: generateUuid

Generates a cryptographically random UUIDv4 using the platform's Web Crypto
API (`globalThis.crypto.randomUUID`). Works in Node.js \>= 18 and modern
browsers without per-call runtime checks.

## Signature

```typescript
function generateUuid(): Uuid
```
