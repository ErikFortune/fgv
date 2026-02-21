[Home](../../README.md) > [Settings](../README.md) > [ILocalDirectoryRef](./ILocalDirectoryRef.md) > load

## ILocalDirectoryRef.load property

Which sublibraries to load from this directory.
- true (default): load all
- false: load none
- object: per-sublibrary control with optional 'default'

**Signature:**

```typescript
readonly load: boolean | Partial<Record<"default" | SubLibraryId, boolean>>;
```
