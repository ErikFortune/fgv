[Home](../README.md) > sanitizeJson

# Function: sanitizeJson

"Sanitizes" an `unknown` by stringifying and then parsing it.  Guarantees a
valid JsonValue | JsonValue but is not idempotent and gives no guarantees
about fidelity. Fails if the supplied value cannot be stringified as Json.

## Signature

```typescript
function sanitizeJson(from: unknown): Result<JsonValue>
```
