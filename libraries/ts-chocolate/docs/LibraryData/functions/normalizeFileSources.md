[Home](../../README.md) > [LibraryData](../README.md) > normalizeFileSources

# Function: normalizeFileSources

Normalizes a file sources parameter to an array.

Accepts either a single source or an array of sources,
and always returns a readonly array.

## Signature

```typescript
function normalizeFileSources(sources: T | readonly T[] | undefined): readonly T[]
```
