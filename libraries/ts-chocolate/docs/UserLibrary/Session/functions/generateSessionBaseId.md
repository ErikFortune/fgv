[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > generateSessionBaseId

# Function: generateSessionBaseId

Generates a SessionBaseId in the format YYYY-MM-DD-HHMMSS-slug.
If a slug is provided it is normalized to kebab-case; otherwise a random
8-character hex string is used.

## Signature

```typescript
function generateSessionBaseId(now: Date, slug: string): Result<BaseSessionId>
```
